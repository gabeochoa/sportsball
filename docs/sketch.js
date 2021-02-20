
const WIDTH = 400;
const HEIGHT = 800;
const LINE_HEIGHT = 100;
const gravity = 50;
const minR = 1; 
const maxR = 9;
balls = [];

let score = 0;
let highScore = 0;

let explosion;
function preload(){
  explosion = loadSound('explosion.wav')
}

function lToC(l){
  switch(l){
    case 8:
      return color(90, 100, 100);
    case 7:
      return color(70, 100, 100);
    case 6:
      return color(100, 100, 100);
    case 5:
      return color(50, 100, 100);
    case 4:
      return color(40, 100, 100);
    case 3:
      return color(20, 100, 100);
    case 2:
      return color(15, 100, 100);
    case 1:
      return color(10, 100, 100);
    default:
      return color(100, 100, 100);
  }
}


class Ball {
  constructor(x, y, l){
    this.position = createVector(x, y);
    this.level = l || 1;
    this.r = 7;
    l = this.level;
    while(l > 0){
      this.r *= 1.5;
      l--;
    }
    this.vel = createVector(0, 0)
    this.acc = createVector(0, 0);
    this.alive = true;
    this.acc = createVector(0, 0.1)
    this.e = null;
  }

  update(elapsedTime){
    if(this.e != null && this.position.y < LINE_HEIGHT){
      this.e = 1;
    }
    if(this.position.y > LINE_HEIGHT){
      this.e = 0;
    }
    if(this.position.y + this.r >= HEIGHT){
      this.acc.set(0, 0);
    }
    this.vel.add(this.acc)
    this.position.add(this.vel)
    this.position.set(
      min(WIDTH - this.r, max(this.position.x, this.r)),
      min(HEIGHT - this.r, max(this.position.y, this.r))
    )
  }

  draw(){
    push();
    colorMode(HSB, 100)
    fill(lToC(this.level))
    circle(this.position.x, this.position.y, this.r * 2);
    pop();
  }

}


let highScoreP = null;
let scoreP = null;

function setup(){
  createCanvas(WIDTH, HEIGHT);
  // balls.push(new Ball(200, 100, 1));
  // balls.push(new Ball(200, 200, 2));
  // balls.push(new Ball(200, 300, 3));
  // balls.push(new Ball(200, 400, 4));
  // balls.push(new Ball(200, 500, 5));
  // balls.push(new Ball(200, 600, 6));
  // balls.push(new Ball(200, 700, 7));
}

function touching(a, b, ar, br){
  const distsq = ((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y))
  const radiisq = (ar+br) * (ar+br)
  return distsq <= radiisq;
}

function merge(a, b){
  if(a.r != b.r || !touching(a.position, b.position, a.r, b.r)){
    return false;
  }
  balls.push(new Ball(a.position.x, a.position.y, a.level + 1))
  a.alive = false;
  b.alive = false;
  explosion.play();
  score += a.level * 10;
  document.getElementById('s').innerHTML = score;
  return true;
}

function resolveCollision(a, b){
  const dx = a.position.copy().sub(b.position);
  const sumR = a.r + b.r;
  const dist2 = dx.copy().dot(dx);
  if(dist2 > (sumR * sumR)){
    return; // no collision
  }
  const d = dx.mag();
  if(d == 0){
    return;
  }
  const mtd = dx.mult( ( (sumR) -d ) / (d * 0.99));

  // TODO: bigger balls? more mass? ;) 
  const m1 = 1/(a.r * a.r);
  const m2 = 1/(b.r * b.r);
  const sumM = m1 + m2;

  a.position.add(mtd.copy().mult(m1 / sumM ));
  b.position.sub(mtd.copy().mult(m2 / sumM ));

  const impactvel = a.vel.copy().sub(b.vel);
  const vn = impactvel.dot(mtd.copy().normalize());
  if(vn > 0){
    // this means they are already moving away from eachother
    return;
  }

  const rest = (1 + 0.85 * vn);
  const imp = -rest / sumM;
  const vimp = mtd.copy().normalize().mult(imp);

  a.vel.add(vimp.copy().mult(m1));
  a.vel.limit(1)
  b.vel.add(vimp.copy().mult(m2));
  b.vel.limit(1)

  a.vel.set(a.vel.x, a.vel.y + 1)
  b.vel.set(b.vel.x, b.vel.y + 1)
}

const elapsedTime = 1/60;
const ballTimeReset = 150;
let ballTime = ballTimeReset;
let newBall = null;

const mergeCooldownMax = 15;
let mergeCooldown = mergeCooldownMax;
let hasMerged = false;

const endGameTimerMax = 60;
let endGameTimer = endGameTimerMax;
let isAnyAbove = false;

// TODO check if mouse is on screen
function mousePressed(){
  if(newBall != null){
    balls.push(newBall);
    newBall = null;
  }
}

function mergeTimer(){
  if(hasMerged){ mergeCooldown --; }
  if(mergeCooldown <= 0){
    hasMerged = false
    mergeCooldown = mergeCooldownMax;
  }
}

let newBallList = [1, 1, 2 ];
let newBallToAdd = 2;

function newBallCode(){
  if(newBall != null){
    newBall.position.set( min(WIDTH-newBall.r, max(newBall.r, mouseX)), 20);
    newBall.draw();
  }

  if(score % 500 == 0){
    newBallList.push(newBallToAdd);
    newBallToAdd++;
  }

  ballTime --;
  if(ballTime <= 0 && newBall == null){
    ballTime = ballTimeReset;
    newBall = new Ball(WIDTH/2, 20, random(newBallList));
  }
}

function draw(){
  frameRate(60);
  background(0, 200, 255, 255);

  mergeTimer();
  newBallCode();

  for(let i=0; i<balls.length; i++){
    for(let j=1; j<balls.length; j++){
      if(i == j) continue;
      if(!hasMerged){
        hasMerged = merge(balls[i], balls[j]);
      }
      resolveCollision(balls[i], balls[j]);
    }
  }

  for(let i=balls.length-1; i>= 0; i--){
    if(balls[i].alive == false){
      balls.splice(i, 1);
      i--;
    }
  }

  isAnyAbove = false;
  for(const b of balls){
    b.update(elapsedTime);
    isAnyAbove = isAnyAbove || b.e==1;
    b.draw();
  }

  if(isAnyAbove){
    endGameTimer --;
  }
  if(!isAnyAbove){
    endGameTimer = endGameTimerMax
  }

  if(endGameTimer < 0){
    endGameTimer = endGameTimerMax
    // clear balls
    balls = [];
    if(score > highScore){
      highScore = score;
      document.getElementById('hs').innerHTML = score;
    }
    isAnyAbove = false;
    score = 0;
    document.getElementById('s').innerHTML = score;
  }

  line(0, LINE_HEIGHT, WIDTH, LINE_HEIGHT)

}
