const DIV_TAG = 'div';
const CLASS_ABSOLUTE = 'absolute';
const CLASS_HIDDEN = 'hidden';
const CLASS_OBSTACLE = 'obstacle';
const CLASS_OBSTACLE_CONTENT = 'obstacle-content';
const CLASS_OBSTACLE_PART = 'obstacle-part';
const CLASS_TOP_OBSTACLE = 'top-obstacle';
const CLASS_BOT_OBSTACLE = 'bot-obstacle';

const MAX_WIDTH = 768;
const MAX_HEIGHT = 1024;

const BEST_SCORE_KEY = '@BEST_SCORE_KEY';

const PLAYER_IMG = '/assets/img/bird';
const PNG_EXT = '.png';
const PLAYER_SPRITES_NUM = 9;
const TOP_OBSTACLE_IMG = '/assets/img/pipe-top.png';
const BOT_OBSTACLE_IMG = '/assets/img/pipe-bot.png';

const PLAYER_WIDTH = 85;
const PLAYER_HEIGHT = 60;
const PLAYER_X = MAX_WIDTH / 2;
const PLAYER_INITIAL_Y = (MAX_HEIGHT / 2) - PLAYER_HEIGHT;
const INITIAL_TILT_ANGLE = -45;
const TILT_DEGRADATION = 15;

const OBSTACLE_WIDTH = 130;
const OBSTACLES_X_OFFSET = 450;
const OBSTACLES_QTY = 2;
const OBSTACLE_GAP_HEIGHT = PLAYER_HEIGHT * 6;
const GAP_Y_INDEX = 1 / 6;  // bigger ratio value makes gap generate at center
const MIN_GAP_Y = MAX_HEIGHT * GAP_Y_INDEX;
const MAX_GAP_Y = MAX_HEIGHT * (1 - GAP_Y_INDEX) - OBSTACLE_GAP_HEIGHT;

const PLAYER_ANIMATE_SPEED = 5; // lower value results in faster flapping of wings
const GAME_SPEED_DX = -4.5; // higher negative val makes obstacles move faster
const DEFAULT_DY = 0.03;  // default fall rate
const GRAVITY_INCREMENT = 1;  // default fall acceleration
const JUMP_GRAVITY_INCREMENT = 8;  // negative acceleration during fall
const JUMP_DY = -60;  // fall rate during jump
const JUMP_STOP_FRAMES = 10;  // higher value increases hold time at top of jump


// DOM ELEMENTS

const gameArea = getEl('#game-area');

const startCard = getEl('#start-card');
const endCard = getEl('#end-card');
const scoreCard = getEl('#score-card');

const startBtn = getEl('#start-btn');
const restartBtn = getEl('#restart-btn');

const currentScoreEl = getEl('.current-score');
const finalScoreEl = getEl('.final-score');
const bestScoreEl = getEl('.best-score');
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
      dy: DEFAULT_DY,
      el: playerImgs[0],
    });

    this.isJumping = false;
    this.imageEls = playerImgs;
    this.spriteIndex = 0;
    this.spriteChangeRecorder = 0;
    this.atJumpTopFrame = 0;
    this.isAtJumpTop = false;
    this.score = 0;
    this.tiltAngle = INITIAL_TILT_ANGLE;
    this.addMovementListeners();
  }

  updateScores() {
    currentScoreEl.innerText = this.score;
  }

  jump() {
    this.tiltAngle = INITIAL_TILT_ANGLE;
    this.isJumping = true;
    this.isAtJumpTop = false;
    this.dy = JUMP_DY;
  }

  addMovementListeners() {
    document.onmousedown = (e) => this.jump();

  }

  hasVerticallyCollided() {
    if (this.y + this.height >= MAX_HEIGHT) return true;
    if (this.y <= 0) this.dy = DEFAULT_DY;

    return false;
  }

  changeSprite() {
    if (++this.spriteChangeRecorder % PLAYER_ANIMATE_SPEED === 0) {
      const spritesNum = this.imageEls.length;
      const parentEl = this.el.parentNode;

      parentEl.removeChild(this.el);
      this.el = this.imageEls[(++this.spriteIndex) % spritesNum];
      this.tiltAngle += TILT_DEGRADATION;
      this.el.style.transform = `rotate(${this.tiltAngle}deg)`
      this.updateStyles();
      parentEl.appendChild(this.el);
    }
  }

  handleVerticalMovement() {
    // top most point of jump reached
    if (this.isJumping && this.dy >= 0) {
      this.isAtJumpTop = true;
    }

    // hold position at top-most point of jump for a while
    if (this.isAtJumpTop && (++this.atJumpTopFrame % JUMP_STOP_FRAMES == 0)) {
      this.atJumpTopFrame = 0;
      this.isAtJumpTop = false;
      this.isJumping = false;
    }

    this.dy += this.isAtJumpTop ? 0
      : this.isJumping ? JUMP_GRAVITY_INCREMENT : GRAVITY_INCREMENT;

    this.moveY();
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
    reset();
    this.player = new Player();
    this.obstacles = this.generateObstacles();
    this.animateMotion();
    this.isDead = false;
    this.prevBestScore = this.getPrevBestScore();
  }

  getPrevBestScore() {
    return +localStorage.getItem(BEST_SCORE_KEY) || 0;
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

    this.prevBestScore = this.player.score;
    localStorage.setItem(BEST_SCORE_KEY, this.player.score);
    newBestEl.classList.remove(CLASS_HIDDEN);
  }

  handleGameOver() {
    finalScoreEl.innerText = this.player.score;
    this.updateBestScore()
    bestScoreEl.innerText = this.prevBestScore;
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

  handlePlayerMovementAndAnimation() {
    this.player.changeSprite();
    this.player.handleVerticalMovement();
    this.player.hasVerticallyCollided() && this.killPlayer();
  }

  killPlayer() {
    this.isDead = true;
  }

  animateMotion() {
    (function animate() {
      this.player.updateScores();

      this.handlePlayerMovementAndAnimation();
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

function loadPlayerSprites() {
  let playerImgs = [];

  for (let i = 1; i <= PLAYER_SPRITES_NUM; i++ ) {
    playerImgs.push(loadImage(PLAYER_IMG + i + PNG_EXT));
  }

  return playerImgs;
}

function init() {
  new Game();
}


// --------------------- logic --------------------------------


gameArea.style.width = addPx(MAX_WIDTH);
gameArea.style.height = addPx(MAX_HEIGHT);

let playerImgs, topObstacleImg, botObstacleImg;

function loadAssets() {
  return [loadImage(TOP_OBSTACLE_IMG), loadImage(BOT_OBSTACLE_IMG), ...loadPlayerSprites()];
}

(async function () {
  [topObstacleImg, botObstacleImg, ...playerImgs] = await Promise.all(loadAssets());

  topObstacleImg.classList.add(CLASS_OBSTACLE_PART, CLASS_TOP_OBSTACLE);
  botObstacleImg.classList.add(CLASS_OBSTACLE_PART, CLASS_BOT_OBSTACLE);

  startBtn.addEventListener('click', () => {
    scoreCard.classList.remove(CLASS_HIDDEN);
    init();
  });

  restartBtn.addEventListener('click', () => {
    init();
  })
})();



