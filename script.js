// DOM ELEMENTS
const canvas = document.getElementById("canvas")
const c = canvas.getContext("2d")
const scoreEl = document.getElementById("score")
const gameOverScreen = document.getElementById("game-over-screen")
const finalScore = document.getElementById("final-score")
const welcomeScreen = document.getElementById("welcome-screen")
const startBtn = document.getElementById("start-btn")
const resetBtn = document.getElementById("reset-btn")
const bestScoreCont = document.getElementById("best-score-p")

// CANVAS DIMENSIONS
canvas.height = innerHeight
canvas.width = innerWidth

// CONSTANTS CONFIG
const CANVAS_Y_OFFSET = 50
const CANVAS_X_OFFSET = 10
const PLAYER_X_VELOCITY = 5

// GLOBAL VARS
let animationFrameID
const keys = {
  arrowLeft: {
    pressed: false
  },
  arrowRight: {
    pressed: false
  }
}

let score
let gameOver
let player
let com
let ball
let walls
let intervals
let bestScore

// UNCOMMENT TO REMOVE BEST SCORE
// console.log(localStorage.getItem("bestScore"))
// localStorage.removeItem("bestScore")
// console.log(localStorage.getItem("bestScore"))

// CLASSES
class Player {
  constructor(isCOM = false) {
    this.color = "white"
    this.isCom = isCOM

    this.width = 100
    this.height = 10

    this.position = {
      x: canvas.width / 2 - this.width / 2,
      y: isCOM ? CANVAS_Y_OFFSET - this.height : canvas.height - this.height - CANVAS_Y_OFFSET
    }

    this.velocity = 0
  }

  draw() {
    c.beginPath()

    c.fillStyle = this.color
    c.fillRect(this.position.x, this.position.y, this.width, this.height)

    c.closePath()
  }

  update() {
    this.draw()

    if (this.isCom) {
      // taking account distance between ball and walls to stop com when "touch" walls
      const distanceBallRightWall = (walls[1].position.x) - (ball.position.x)
      const distanceBallLeftWall = (ball.position.x) - (walls[0].position.x + walls[0].width)

      // if distance is greater com follows ball
      if (distanceBallRightWall > this.width / 2 && distanceBallLeftWall > this.width / 2) {
        this.position.x = ball.position.x - this.width / 2
      }
    } else {
      // else is player movement
      this.position.x += this.velocity
    }

    
  }
}

class Ball {
  constructor() {
    this.radius = 5
    this.color = "white"

    this.position = {
      x: canvas.width / 2,
      y: canvas.height / 2
    }

    this.velocity = {
      x: 1.5,
      y: 1
    }
  }

  draw() {
    c.beginPath()

    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)

    c.fillStyle = this.color
    c.fill()

    c.closePath()
  }

  update() {
    this.draw()

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

class Wall {
  constructor(side) {
    this.color = "white"

    this.width = 10
    this.height = canvas.height - CANVAS_Y_OFFSET * 2

    this.position = {
      x: side === "left" ? 0 + CANVAS_X_OFFSET : canvas.width - CANVAS_X_OFFSET - this.width,
      y: CANVAS_Y_OFFSET
    }
  }
  
  draw() {
    c.beginPath()

    c.fillStyle = this.color
    c.fillRect(this.position.x, this.position.y, this.width, this.height)

    c.closePath()
  }

  update() {
    this.draw()
  }
}

// INIT
function init() {
  welcomeScreen.style.display = "none"
  gameOverScreen.style.display = "none"

  score = 0
  gameOver = false
  player = new Player()
  com = new Player(true)
  ball = new Ball()
  walls = [new Wall("left"), new Wall("right")]
  intervals = []
  bestScore = localStorage.getItem("bestScore") || 0

  animate()

  speedUpBall()
  startScoreCount()
}

// GAME MAIN LOOP
function animate() {
  clearCanva()
  animationFrameID = requestAnimationFrame(animate)

  // player x movement
  getPlayerXMovement()

  // stop player in x bounds
  stopPlayerInXBounds()

  // bounce ball in player
  bounceBallInPlayer()

  // bounce ball in walls
  bounceBallInWalls()

  // bounce ball in com
  bounceBallInCom()

  // update score in UI
  renderScore()

  // check game over state
  checkGameOver()

  player.update()
  com.update()
  ball.update()
  walls.forEach(wall => wall.update())

  if (gameOver) {
    handleGameOver()
  }
}

// FUNCTIONS
function clearCanva() {
  c.clearRect(0, 0, canvas.width, canvas.height)
}
function getPlayerXMovement() {
  if (keys.arrowLeft.pressed && keys.arrowRight.pressed || !keys.arrowLeft.pressed && !keys.arrowRight.pressed) {
    player.velocity = 0
  } else if (keys.arrowLeft.pressed) {
    player.velocity = -PLAYER_X_VELOCITY
  } else if (keys.arrowRight.pressed) {
    player.velocity = PLAYER_X_VELOCITY
  }
}
function stopPlayerInXBounds() {
  if (player.position.x + player.velocity <= 0 + CANVAS_X_OFFSET) {
    player.position.x = 0 + CANVAS_X_OFFSET
  }
  if (player.position.x + player.width + player.velocity >= canvas.width - CANVAS_X_OFFSET) {
    player.position.x = canvas.width - player.width - CANVAS_X_OFFSET
  }
}
function bounceBallInPlayer() {
  // ball bottom position is equal or below player top position
  const isBallBottomBelowPlayerTop = ball.position.y + ball.radius + ball.velocity.y >= player.position.y

  // ball x position is greater or equal player left bound
  const isBallXGreaterPlayerLeftBound = ball.position.x >= player.position.x

  // ball x position is less or equal player right bound
  const isBallXLessPlayerRightBound = ball.position.x <= player.position.x + player.width

  // ball bottom position is above player top position + 1
  const isBallBottomGreaterPlayerTop = ball.position.y + ball.radius + ball.velocity.y < player.position.y + 10

  // TODO implement player sides bounce

  if (isBallBottomBelowPlayerTop && isBallXGreaterPlayerLeftBound && isBallXLessPlayerRightBound && isBallBottomGreaterPlayerTop) {
    ball.velocity.y = -ball.velocity.y
  }
}
function bounceBallInWalls() {
  const isBallBelowWalls = ball.position.y - ball.radius + ball.velocity.y > walls[0].position.y - ball.radius

  const isBallAboveWalls = ball.position.y + ball.radius + ball.velocity.y < walls[0].position.y + walls[0].height + ball.radius

  const isBallOnWallLeft = ball.position.x - ball.radius + ball.velocity.x <= walls[0].position.x + walls[0].width

  const isBallOnWallRight = ball.position.x + ball.radius + ball.velocity.x >= walls[1].position.x
  
  if (isBallBelowWalls && isBallAboveWalls) {
    if (isBallOnWallLeft || isBallOnWallRight) {
      ball.velocity.x = -ball.velocity.x
    }
  }
}
function bounceBallInCom() {
  // ball top position is equal or greater player bottom position
  const isBallTopAboveComBottom = ball.position.y - ball.radius + ball.velocity.y <= com.position.y + com.height

  if (isBallTopAboveComBottom) {
    ball.velocity.y = -ball.velocity.y
  }
}
function speedUpBall() {
  const id = setInterval(() => {
    // if (Math.abs(ball.velocity.x) < PLAYER_X_VELOCITY) {
    //   ball.velocity.x *= 1.2
    // }
    ball.velocity.y *= 1.2
  }, 2000);

  intervals.push({id})
}
function startScoreCount() {
  const id = setInterval(() => {
    score++
  }, 100);

  intervals.push({id})
}
function renderScore() {
  scoreEl.textContent = score
}
function checkGameOver() {
  // ball bottom position is below player top position with some offset
  const isBallBottomBelowPlayerTop = ball.position.y - ball.radius > player.position.y + player.height + 60

  if (isBallBottomBelowPlayerTop) {
    gameOver = true
  }
}
function handleGameOver() {
  cancelAnimationFrame(animationFrameID)
  intervals.forEach(interval => clearInterval(interval.id))

  gameOverScreen.style.display = "flex"
  finalScore.textContent = score

  if (score > bestScore) {
    localStorage.setItem("bestScore", score)
    console.log("new best score!")
  }

  if (bestScore > 0) {
    bestScoreCont.textContent = `Best: ${localStorage.getItem("bestScore")} points`
  }
}

// EVENT LISTENERS
window.addEventListener("keydown", ({key}) => {
  switch (key) {
    case "ArrowLeft":
      keys.arrowLeft.pressed = true
      break
    case "ArrowRight":
      keys.arrowRight.pressed = true
      break
  }
})
window.addEventListener("keyup", ({key}) => {
  switch (key) {
    case "ArrowLeft":
      keys.arrowLeft.pressed = false
      break
    case "ArrowRight":
      keys.arrowRight.pressed = false
      break
  }
})
startBtn.addEventListener("click", init)
resetBtn.addEventListener("click", init)