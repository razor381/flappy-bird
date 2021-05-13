const DIV_TAG = 'div';
const IMG_TAG = 'img';
const CLASS_ABSOLUTE = 'absolute';
const CLASS_HIDDEN = 'hidden';

const MAX_WIDTH = 768;
const MAX_HEIGHT = 1024;

const ARROW_UP = 'ArrowUp'  ;

const BEST_SCORE_KEY = '@BEST_SCORE';

const PLAYER_IMG = '/assets/img/player.png';
const PLAYER_WIDTH = 85;
const PLAYER_HEIGHT = 60;
const PLAYER_X = (MAX_WIDTH / 2) - PLAYER_WIDTH;
const PLAYER_INITIAL_Y = (MAX_HEIGHT / 2) - PLAYER_HEIGHT;
const GAME_SPEED = 10;
const GRAVITY_DY = 10;
const JUMP_DY = -50;


// DOM ELEMENTS

const gameArea = getEl('#game-area');

const startCard = getEl('#start-card');
const endCard = getEl('#end-card');
const scoreCard = getEl('#score-card');

const startBtn = getEl('#start-btn');
const restartBtn = getEl('#restart-btn');

const currentScoreEl = getEl('.current-score');
const finalScoreEl = getEl('.final-score');
const bestScoreEls = getEl('.best-score', true);
const newBestEl = getEl('.new-best');


// ------------------------- classes ---------------------------


class Base {
  constructor({ x, y, width, height, dx, dy, el }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.dx = dx;
    this.dy = dy;
    this.el = el;

    this.updateStyles();
    this.renderEl();
  }

  updateStyles() {
    this.el.style.width = addPx(this.width);
    this.el.style.height = addPx(this.height);
    this.el.style.position = CLASS_ABSOLUTE;
    this.el.style.top = addPx(this.y);
    this.el.style.left = addPx(this.x);
  }

  renderEl() {
    renderElementIntoDom(this.el, gameArea);
  }

  moveX() {
    this.x += this.dx;
    this.updateStyles();
  }

  moveY() {
    this.y += this.dy;
    this.updateStyles();
  }

  resetToRight() {
    this.x = MAX_WIDTH;
  }
}

class Player extends Base {
  constructor() {
    super({
      x: PLAYER_X,
      y: PLAYER_INITIAL_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      dx: 0,
      dy: GRAVITY_DY,
      el: playerImg,
    });

    this.addMovementListeners();
  }

  jump() {
    this.dy = JUMP_DY;
    setTimeout(() => this.dy = GRAVITY_DY, 100);
  }

  addMovementListeners() {
    document.onmousedown = (e) => this.jump();
  }

  isVerticalCollision() {
    if (this.y + this.height >= MAX_HEIGHT) return true;

    if (this.y <= 0) this.dy = GRAVITY_DY;
    return false;

  }

  checkObstructions() {
    return this.isVerticalCollision();
  }
}

class Obstacle extends Base {
  constructor(gapPosition) {

  }
}


class Game {
  constructor() {
    this.initialize();
    this.player = new Player();
    this.animateMotion();
  }

  initialize() {
    // this.prevBestScore = localStorage.getItem(BEST_SCORE_KEY) || 0;
    // this.updateBestScoreElements();
    reset();
  }

  animateMotion() {
    (function animate() {
      // this.player.updateScores();
      // this.player.increaseSpeed();

      this.player.moveY();
      const isDead = this.player.checkObstructions();

      !isDead && requestAnimationFrame(animate.bind(this))
    }.bind(this))();
  }
}


// ------------------------- functions ---------------------------


function loadImage(src) {
  return new Promise(resolve => {
    let img = new Image();
    img.onload = (() => resolve(img));
    img.src = src;
  });
}

function reset() {
  startCard.classList.add(CLASS_HIDDEN);
  endCard.classList.add(CLASS_HIDDEN);
  newBestEl.classList.add(CLASS_HIDDEN);
  gameArea.textContent = '';
}

function addPx(val) {
  return val + 'px';
}

function renderElementIntoDom(el, parentEl) {
  parentEl.appendChild(el);
}

function createNewElement(tag, classes, attributes=[]) {
  const newEl = document.createElement('div');
  newEl.classList.add(...classes);
  return newEl;
}

function getEl(name, all=false) {
  return all?  document.querySelectorAll(name) : document.querySelector(name);
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function init() {
  const game = new Game();
}


// --------------------- logic --------------------------------


gameArea.style.width = addPx(MAX_WIDTH);
gameArea.style.height = addPx(MAX_HEIGHT);

let playerImg;

(async function () {
  playerImg = await loadImage(PLAYER_IMG);

  startBtn.addEventListener('click', () => {
    // scoreCard.classList.remove(CLASS_HIDDEN);
    init();
  });

  restartBtn.addEventListener('click', () => {
    init();
  })
})();



