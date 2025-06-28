const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const loadingDiv = document.getElementById('loading');

const setupForm = document.getElementById('setupForm');
const progressDiv = document.getElementById('progress');
const questionDiv = document.getElementById('question');
const answersDiv = document.getElementById('answers');
const timerBar = document.getElementById('timerBar');
const timerText = document.getElementById('timerText');
const scoreboardDiv = document.getElementById('scoreboard');

const playerNameResult = document.getElementById('playerNameResult');
const totalScore = document.getElementById('totalScore');
const correctCountResult = document.getElementById('correctCount');
const percentageResult = document.getElementById('percentage');
const avgTimeResult = document.getElementById('avgTime');
const playAgainBtn = document.getElementById('playAgain');
const exitBtn = document.getElementById('exit');

let questions = [];
let currentQuestion = 0;
let score = 0;
let timer = null;
let timeLeft = 20;
let answered = false;
let correctCount = 0;
let incorrectCount = 0;
let playerName = '';
let questionCount = 0;
let totalTime = 0;
let startTime = 0;

setupForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  playerName = document.getElementById('playerName').value.trim();
  questionCount = parseInt(document.getElementById('questionCount').value, 10);
  const difficulty = document.getElementById('difficulty').value;
  let category = document.getElementById('category').value;
  if (category === 'mixed') category = ''; // API: omit category for mixed

  setupScreen.classList.add('hidden');
  loadingDiv.classList.remove('hidden');

  try {
    const url= `https://opentdb.com/api.php?amount=${questionCount}${category ? `&category=${category}` : ''}&difficulty=${difficulty}&type=multiple&encode=url3986`;
    const res= await fetch(url);
    const data = await res.json();
    if (data.response_code !== 0) throw new Error('No se pudieron obtener preguntas.');
    questions = data.results;
    currentQuestion = 0;
    score = 0;
    correctCount = 0;
    incorrectCount = 0;
    totalTime = 0;
    loadingDiv.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    showQuestion();
  } catch (err) {
    loadingDiv.classList.add('hidden');
    alert('Error al obtener preguntas. Intenta de nuevo.');
    setupScreen.classList.remove('hidden');
  }
});

function showQuestion() {
  answered = false;
  clearInterval(timer);
  timeLeft = 20;
  startTime = Date.now();


  progressDiv.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}`;    // Progreso

  const q = questions[currentQuestion];     // Pregunta
  questionDiv.innerHTML = decodeURIComponent(q.question);

  // Opciones
  const options = [...q.incorrect_answers.map(decodeURIComponent), decodeURIComponent(q.correct_answer)];
  shuffle(options);
  answersDiv.innerHTML = '';
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.className = 'answer-btn';
    btn.onclick = () => selectAnswer(btn, option, decodeURIComponent(q.correct_answer));
    answersDiv.appendChild(btn);
  });

  // Temporizador visual
  timerBar.style.width = '100%';
  timerText.textContent = `${timeLeft}s`;
  timerText.classList.remove('warning');     // Quita la advertencia visual si es que existe
  timer= setInterval(() => {
    timeLeft--;
    timerBar.style.width = `${(timeLeft / 20) * 100}%`;
    timerText.textContent = `${timeLeft}s`;


    // Indica cuando quedan 5 segundos o menos
    if (timeLeft <= 5) {
      timerText.classList.add('warning');
    } else {
      timerText.classList.remove('warning');
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      showFeedback(null, decodeURIComponent(questions[currentQuestion].correct_answer));
    }
  }, 1000);

  updateScoreboard();
}

function selectAnswer(btn, selected, correct) {
  if (answered) return;
  answered = true;
  clearInterval(timer);


  totalTime += (20 - timeLeft);      // Calcular tiempo empleado en la pregunta

  // Feedback visual
  const buttons = answersDiv.querySelectorAll('button');
  buttons.forEach(b => {
    if (b.textContent === correct) {
      b.classList.add('correct');
    } else if (b === btn) {
      b.classList.add('incorrect');
    }
    b.disabled = true;
  });
  if (selected === correct) {
    score += 10;
    correctCount++;
  }else{
    incorrectCount++;
  }

  updateScoreboard();

  setTimeout(nextQuestion, 1200);
}

function showFeedback(selected, correct) {
  const buttons = answersDiv.querySelectorAll('button');
  buttons.forEach(b => {
    if (b.textContent === correct) {
      b.classList.add('correct');
    } else {
      b.classList.add('incorrect');
    }
    b.disabled = true;
  });


  // Si el usuario no respondió, cuenta como incorrecta y suma 20s al tiempo total
  totalTime += 20;
  updateScoreboard();
  setTimeout(nextQuestion, 1200);
}

function updateScoreboard() {
  scoreboardDiv.innerHTML = `
    <strong>Puntuación:</strong> ${score} |
    <span style="color:green">✔️ ${correctCount}</span> /
    <span style="color:red">❌ ${incorrectCount}</span>
  `;
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  gameScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  playerNameResult.textContent = `Jugador: ${playerName}`;
  totalScore.textContent = `Puntuación total: ${score}`;
  correctCountResult.textContent = `Respuestas correctas: ${correctCount} de ${questions.length}`;
  const percent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  percentageResult.textContent = `Porcentaje de aciertos: ${percent}%`;
  const avgTime = questions.length > 0 ? (totalTime / questions.length).toFixed(2) : '0.00';
  avgTimeResult.textContent = `Tiempo promedio por pregunta: ${avgTime} s`;
}


// Botón para jugar de nuevo con la misma configuración
playAgainBtn.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  currentQuestion = 0;
  score = 0;
  correctCount = 0;
  incorrectCount = 0;
  totalTime = 0;
  showQuestion();
});

// Botón para volver a la configuración inicial
exitBtn.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
});


// Utilidad para mezclar opciones
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}