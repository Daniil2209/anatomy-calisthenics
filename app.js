// App controller for SPORTI - Calisthenics Anatomy

document.addEventListener('DOMContentLoaded', () => {
  
  // --- STATE ---
  let activeMuscleGroup = null; // null means 'all'
  let searchQuery = '';
  let activeDifficulty = 'all'; // 'all', 'easy', 'medium', 'hard'
  let activeView = 'front'; // 'front', 'back'

  // --- DOM ELEMENTS ---
  const svgFront = document.getElementById('svg-front');
  const svgBack = document.getElementById('svg-back');
  const toggleFront = document.getElementById('toggle-front');
  const toggleBack = document.getElementById('toggle-back');
  
  const muscleInfoPlaceholder = document.getElementById('muscle-info-placeholder');
  const muscleInfoContent = document.getElementById('muscle-info-content');
  const muscleInfoName = document.getElementById('muscle-info-name');
  const muscleInfoAnatomy = document.getElementById('muscle-info-anatomy');
  const muscleInfoExercises = document.getElementById('muscle-info-exercises');
  const btnScrollToExercises = document.getElementById('btn-scroll-to-exercises');
  
  const quickCards = document.querySelectorAll('.quick-card');
  const musclePaths = document.querySelectorAll('.muscle-group-path');
  
  const activeGroupLabel = document.getElementById('active-group-label');
  const exerciseCount = document.getElementById('exercise-count');
  const exercisesGrid = document.getElementById('exercises-grid');
  const exercisesEmptyState = document.getElementById('exercises-empty-state');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  const exerciseModal = document.getElementById('exercise-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnLogo = document.getElementById('btn-logo');

  // --- ANATOMY VIEWS TOGGLE ---
  function switchView(view) {
    activeView = view;
    if (view === 'front') {
      toggleFront.classList.add('active');
      toggleBack.classList.remove('active');
      svgFront.classList.add('active');
      svgBack.classList.remove('active');
    } else {
      toggleBack.classList.add('active');
      toggleFront.classList.remove('active');
      svgBack.classList.add('active');
      svgFront.classList.remove('active');
    }
  }

  toggleFront.addEventListener('click', () => switchView('front'));
  toggleBack.addEventListener('click', () => switchView('back'));

  // --- MUSCLE SELECTION LOGIC ---
  function selectMuscleGroup(muscleKey, scroll = false) {
    if (activeMuscleGroup === muscleKey) {
      // Toggle off if clicking the already active muscle
      resetSelection();
      return;
    }

    activeMuscleGroup = muscleKey;
    const muscleData = musclesData[muscleKey];
    
    if (!muscleData) return;

    // 1. Auto-switch SVG view if the muscle is on the other side
    if (muscleData.view && muscleData.view !== activeView) {
      switchView(muscleData.view);
    }

    // 2. Update active states in SVG paths
    musclePaths.forEach(path => {
      if (path.getAttribute('data-muscle') === muscleKey) {
        path.classList.add('active');
      } else {
        path.classList.remove('active');
      }
    });

    // 3. Update active states in Quick Selection Cards
    quickCards.forEach(card => {
      if (card.getAttribute('data-muscle') === muscleKey) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // 4. Populate Muscle Info Panel
    muscleInfoPlaceholder.classList.add('hidden');
    muscleInfoContent.classList.remove('hidden');
    muscleInfoName.textContent = muscleData.name;
    muscleInfoAnatomy.textContent = muscleData.anatomyInfo;
    muscleInfoExercises.textContent = muscleData.exercisesInfo;

    // 5. Update catalog labels & filter exercises
    activeGroupLabel.textContent = muscleData.name.split(' (')[0]; // Short name
    filterAndRenderExercises();

    // 6. Optional scroll to exercises
    if (scroll) {
      setTimeout(() => {
        document.getElementById('exercises-section').scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  function resetSelection() {
    activeMuscleGroup = null;
    
    // Clear active classes
    musclePaths.forEach(path => path.classList.remove('active'));
    quickCards.forEach(card => card.classList.remove('active'));
    
    // Reset Info Panel to placeholder
    muscleInfoContent.classList.add('hidden');
    muscleInfoPlaceholder.classList.remove('hidden');
    
    // Reset catalog label
    activeGroupLabel.textContent = 'Все группы';
    
    filterAndRenderExercises();
  }

  // Bind click handlers to SVG muscle paths
  musclePaths.forEach(path => {
    path.addEventListener('click', () => {
      const muscleKey = path.getAttribute('data-muscle');
      selectMuscleGroup(muscleKey, true);
    });
  });

  // Bind click handlers to Quick Cards
  quickCards.forEach(card => {
    card.addEventListener('click', () => {
      const muscleKey = card.getAttribute('data-muscle');
      selectMuscleGroup(muscleKey, true);
    });
  });

  // Logo resets the app state
  btnLogo.addEventListener('click', (e) => {
    e.preventDefault();
    resetSelection();
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    activeDifficulty = 'all';
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-difficulty') === 'all') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    filterAndRenderExercises();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- FILTER & RENDER EXERCISES ---
  function filterAndRenderExercises() {
    // Filter the exercises list based on current state
    const filtered = exercisesData.filter(ex => {
      // 1. Muscle group match
      const matchesMuscle = !activeMuscleGroup || ex.muscleGroup === activeMuscleGroup;
      
      // 2. Search query match (name or worked muscles list)
      const matchesSearch = !searchQuery || 
        ex.name.toLowerCase().includes(searchQuery) ||
        ex.musclesWorked.some(m => m.toLowerCase().includes(searchQuery));
        
      // 3. Difficulty match
      const matchesDifficulty = activeDifficulty === 'all' || ex.difficulty === activeDifficulty;
      
      return matchesMuscle && matchesSearch && matchesDifficulty;
    });

    renderExercises(filtered);
  }

  function getDifficultyText(difficulty) {
    switch (difficulty) {
      case 'easy': return 'Легкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Сложный';
      default: return difficulty;
    }
  }

  function renderExercises(exercises) {
    // Clear grid
    exercisesGrid.innerHTML = '';
    
    // Update count label
    const count = exercises.length;
    let countText = `${count} `;
    if (count === 0) countText += 'упражнений';
    else if (count === 1) countText += 'упражнение';
    else if (count >= 2 && count <= 4) countText += 'упражнения';
    else countText += 'упражнений';
    exerciseCount.textContent = countText;

    if (count === 0) {
      exercisesEmptyState.classList.remove('hidden');
      exercisesGrid.classList.add('hidden');
      return;
    }

    exercisesEmptyState.classList.add('hidden');
    exercisesGrid.classList.remove('hidden');

    exercises.forEach(ex => {
      const card = document.createElement('div');
      card.className = 'exercise-card';
      card.setAttribute('data-id', ex.id);
      
      const difficultyText = getDifficultyText(ex.difficulty);
      const musclesString = ex.musclesWorked.join(', ');
      
      card.innerHTML = `
        <div class="card-header">
          <h3 class="card-title">${ex.name}</h3>
          <span class="difficulty-badge ${ex.difficulty}">${difficultyText}</span>
        </div>
        <div class="card-body">
          <div class="target-muscles">
            <strong>Мышцы:</strong> ${musclesString}
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-val">${ex.recommendations.sets}</span>
              <span class="stat-lbl">Подходы</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">${ex.recommendations.reps}</span>
              <span class="stat-lbl">Повторения</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="learn-more-link">Инструкция <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      `;
      
      card.addEventListener('click', () => openExerciseModal(ex.id));
      exercisesGrid.appendChild(card);
    });
  }

  // --- SEARCH EVENTS ---
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    if (searchQuery.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    filterAndRenderExercises();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    filterAndRenderExercises();
    searchInput.focus();
  });

  // --- DIFFICULTY FILTER EVENTS ---
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDifficulty = btn.getAttribute('data-difficulty');
      filterAndRenderExercises();
    });
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    activeDifficulty = 'all';
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-difficulty') === 'all') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    resetSelection();
  });

  // --- EXERCISE DETAIL MODAL ---
  function openExerciseModal(exerciseId) {
    const ex = exercisesData.find(e => e.id === exerciseId);
    if (!ex) return;

    // Populate contents
    const modalDiff = document.getElementById('modal-difficulty');
    modalDiff.className = `difficulty-badge ${ex.difficulty}`;
    modalDiff.textContent = getDifficultyText(ex.difficulty);
    
    document.getElementById('modal-title').textContent = ex.name;
    document.getElementById('modal-muscles').textContent = ex.musclesWorked.join(', ');
    
    // Sets and reps
    document.getElementById('modal-sets').textContent = ex.recommendations.sets;
    document.getElementById('modal-reps').textContent = ex.recommendations.reps;
    
    // Safety tips
    document.getElementById('modal-safety').textContent = ex.safety;
    
    // Instructions (ordered list)
    const instructionsList = document.getElementById('modal-instructions');
    instructionsList.innerHTML = '';
    ex.instructions.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      instructionsList.appendChild(li);
    });

    // Mistakes (unordered list)
    const mistakesList = document.getElementById('modal-mistakes');
    mistakesList.innerHTML = '';
    ex.mistakes.forEach(mistake => {
      const li = document.createElement('li');
      li.textContent = mistake;
      mistakesList.appendChild(li);
    });

    // Show modal
    exerciseModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
  }

  function closeExerciseModal() {
    exerciseModal.classList.remove('active');
    document.body.style.overflow = ''; // restore scrolling
  }

  modalCloseBtn.addEventListener('click', closeExerciseModal);
  
  // Close modal when clicking on the overlay backdrop
  exerciseModal.addEventListener('click', (e) => {
    if (e.target === exerciseModal) {
      closeExerciseModal();
    }
  });

  // Close modal on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && exerciseModal.classList.contains('active')) {
      closeExerciseModal();
    }
  });

  // --- INITIALIZATION ---
  filterAndRenderExercises();
});
