const DIV_TAG = 'div';
const IMG_TAG = 'img';
const CLASS_ABSOLUTE = 'absolute';
const CLASS_HIDDEN = 'hidden';
const CLASS_OBSTACLE = 'obstacle';
const CLASS_OBSTACLE_CONTENT = 'obstacle-content';
const CLASS_TOP_OBSTACLE = 'top-obstacle';
const CLASS_BOT_OBSTACLE = 'bot-obstacle';

const MAX_WIDTH = 768;
const MAX_HEIGHT = 1024;

const ARROW_UP = 'ArrowUp';
const ARROW_DOWN = 'ArrowDown';
const BEST_SCORE_KEY = '@BEST_SCORE_KEY';

const PLAYER_IMG = '/assets/img/player.png';
const TOP_OBSTACLE_IMG = '/assets/img/pipe-top.png';
const BOT_OBSTACLE_IMG = '/assets/img/pipe-bot.png';

const PLAYER_WIDTH = 85;
const PLAYER_HEIGHT = 60;
const PLAYER_X = MAX_WIDTH / 2;
const PLAYER_INITIAL_Y = (MAX_HEIGHT / 2) - PLAYER_HEIGHT;

const OBSTACLE_WIDTH = 130;
const OBSTACLES_X_OFFSET = 450;
const OBSTACLES_QTY = 2;
const OBSTACLE_GAP_HEIGHT = PLAYER_HEIGHT * 4;
const GAP_Y_INDEX = 1 / 6;
const MIN_GAP_Y = MAX_HEIGHT * GAP_Y_INDEX;
const MAX_GAP_Y = MAX_HEIGHT * (1 - GAP_Y_INDEX) - OBSTACLE_GAP_HEIGHT;

const GAME_SPEED_DX = -4;
const GRAVITY_DY = 5;
// const GRAVITY_DY = 0;
const JUMP_DY = -20;


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

    this.score = 0;
    this.addMovementListeners();
  }

  jump() {
    this.dy = JUMP_DY;
    setTimeout(() => this.dy = GRAVITY_DY, 80);
  }

  // for development purposes
  goUp() {
    this.y -= 50;
  }

  // for development purposes
  goDown() {
    this.y += 50;
  }

  addMovementListeners() {
    document.onmousedown = (e) => this.jump();

    // for development purposes
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case ARROW_UP:
          this.goUp();
          break;
        case ARROW_DOWN:
          this.goDown();
          break;
        default:
      }
    });

  }

  hasVerticallyCollided() {
    if (this.y + this.height >= MAX_HEIGHT) return true;
    if (this.y <= 0) this.dy = GRAVITY_DY;

    return false;
  }
}

class Obstacle extends Base {
  constructor(xOffset) {
    const { parentEl, topObstacleEl, botObstacleEl } = getObstacleElement();

    super({
      x: MAX_WIDTH + xOffset,
      y: 0,
      width: OBSTACLE_WIDTH,
      height: MAX_HEIGHT,
      dx: GAME_SPEED_DX,
      dy: 0,
      el: parentEl,
    });

    this.gapHeight = OBSTACLE_GAP_HEIGHT;
    this.gapY = this.getRandomGapY();
    this.topObstacleEl = topObstacleEl;
    this.botObstacleEl = botObstacleEl;
    this.hasPassedPlayer = false;

    this.generateNewGapY();
  }

  createGap() {
    this.topObstacleEl.style.height = addPx(this.gapY);
    this.botObstacleEl.style.height = addPx(MAX_HEIGHT - this.gapY - this.gapHeight);
  }

  getRandomGapY() {
    return getRandomInteger(MIN_GAP_Y, MAX_GAP_Y);
  }

  generateNewGapY() {
    this.hasPassedPlayer = false;
    this.gapY = this.getRandomGapY();
    this.createGap();
  }

  checkOutOfScreen() {
    if (this.x + this.width < 0) {
      this.generateNewGapY();
      this.resetToRight();
    }
  }

  hasHitPlayer(player) {
    const playerRightWall = player.x + player.width,
          playerBottomWall = player.y + player.height;

    if (player.x > this.x + this.width) {
      player.score++;
      this.hasPassedPlayer = true;
      return false;
    }

    if ((playerRightWall >= this.x) && (player.x <= (this.x + this.width))) {
      if (player.y <= this.gapY) return true;
      if (playerBottomWall >= (this.gapY + this.gapHeight)) return true;

      return false;
    }

    return false;
  }
}


class Game {
  constructor() {
    this.initialize();
    this.player = new Player();
    this.obstacles = this.generateObstacles();
    this.animateMotion();
    this.isDead = false;
    this.prevBestScore = 0;
  }

  initialize() {
    this.prevBestScore = localStorage.getItem(BEST_SCORE_KEY) || 0;
    this.updateBestScoreElements();
    reset();
  }

  updateBestScoreElements() {
    bestScoreEls.forEach((el) => el.innerText = this.prevBestScore);
  }

  generateObstacles() {
    const obstacles = [];

    for (let i = 0; i < OBSTACLES_QTY; i++) {
      obstacles.push(new Obstacle(i * OBSTACLES_X_OFFSET));
    }

    return obstacles;
  }

  updateBestScore() {
    if (this.player.score <= this.prevBestScore) return;

    localStorage.setItem(BEST_SCORE_KEY, this.player.score);
    this.prevBestScore = this.player.score;
    newBestEl.classList.remove(CLASS_HIDDEN);
    this.updateBestScoreElements();
  }

  handleGameOver() {
    finalScoreEl.innerText = this.player.score;
    this.updateBestScore()
    endCard.classList.remove(CLASS_HIDDEN);
  }

  handleObstacleMovement() {
    this.obstacles.forEach((obstacle) => {
      if (!obstacle.hasPassedPlayer && obstacle.hasHitPlayer(this.player)) {
        this.killPlayer();
      }
      obstacle.moveX();
      obstacle.checkOutOfScreen();
    });
  }

  handlePlayerMovement() {
    this.player.moveY();
    this.player.hasVerticallyCollided() && this.killPlayer();
  }

  killPlayer() {
    this.isDead = true;
  }

  animateMotion() {
    (function animate() {
      // this.player.updateScores();

      this.handlePlayerMovement();
      this.handleObstacleMovement();

      this.isDead ? this.handleGameOver() : requestAnimationFrame(animate.bind(this));
    }.bind(this))();
  }
}


// ------------------------- functions ---------------------------


function getObstacleElement() {
  const parentEl = createNewElement(DIV_TAG, [CLASS_OBSTACLE]);
  const contentEl = createNewElement(DIV_TAG, [CLASS_OBSTACLE_CONTENT]);

  const topObstacleEl = topObstacleImg.cloneNode();
  const botObstacleEl = botObstacleImg.cloneNode();

  contentEl.append(topObstacleEl, botObstacleEl);
  parentEl.appendChild(contentEl);

  return {parentEl, topObstacleEl, botObstacleEl};
}

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

let playerImg, topObstacleImg, botObstacleImg;

(async function () {
  playerImg = await loadImage(PLAYER_IMG);
  topObstacleImg = await loadImage(TOP_OBSTACLE_IMG);
  botObstacleImg = await loadImage(BOT_OBSTACLE_IMG);

  topObstacleImg.classList.add(CLASS_TOP_OBSTACLE);
  botObstacleImg.classList.add(CLASS_BOT_OBSTACLE);

  startBtn.addEventListener('click', () => {
    // scoreCard.classList.remove(CLASS_HIDDEN);
    init();
  });

  restartBtn.addEventListener('click', () => {
    init();
  })
})();



