// Game Settings

let N;
let mode;
let sensors;
let start;
let end;

if (localStorage.getItem("N")) {
  N = parseInt(localStorage.getItem("N"));
  mode = localStorage.getItem("mode");
  sensors = Boolean(localStorage.getItem("sensor"));
} else {
  localStorage.setItem("N", 0);
  localStorage.setItem("mode", "KEYS");
  sensors = Boolean(localStorage.getItem("sensor"));
  N = 0;
  mode = "KEYS";
  sensors = false;
}

function play() {
  N = localStorage.setItem("N", 0);
  mode = localStorage.setItem("mode", "KEYS");
  sensors = localStorage.setItem("sensor", "");
  document.location.reload();
}
function learn() {
  N = localStorage.setItem("N", 10);
  mode = localStorage.setItem("mode", "AI");
  sensors = localStorage.setItem("sensor", "true");
  document.location.reload();
}

// Listeners

function RestartGame(event) {
  if (event.code == "KeyR") {
    document.removeEventListener("keydown", RestartGame);
    document.location.reload();
  }
}
function PauseGame(event) {
  if (event.code == "Escape") {
    if (pauseScreen.classList.contains("active")) {
      pauseScreen.classList.remove("active");
      requestAnimationFrame(animate);
    } else {
      pauseScreen.classList.add("active");
      cancelAnimationFrame(start);
    }
  }
}
document.addEventListener("keydown", RestartGame);
document.addEventListener("keydown", PauseGame);

// Get Car
const carCanvas = document.getElementById("carCanvas");
// Get Network
const networkCanvas = document.getElementById("networkCanvas");
// Score
const rate = document.querySelector(".title");
const pauseScreen = document.querySelector(".wrapper");
// Widths
carCanvas.width = 200;
networkCanvas.width = 600;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

// Game Start
const cars = generateCars(N);
let bestCar = cars[0];

if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetWork.mutate(cars[i].brain, 0.1);
    }
  }
}

// AI
function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
  localStorage.removeItem("bestBrain");
}

const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -200, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -600, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -800, 30, 50, "DUMMY", 2, getRandomColor()),
];

function generateCars(N) {
  const cars = [];
  for (let i = 0; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, mode, 5));
  }
  return cars;
}

function randomLine(lines) {
  return Math.ceil(Math.random() * lines);
}

animate();

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    if (bestCar.y + 300 < traffic[i].y) {
      traffic[i] = new Car(
        road.getLaneCenter(randomLine(3)),
        bestCar.y - 700,
        30,
        50,
        "DUMMY",
        2,
        getRandomColor()
      );
      end += 10;
    }

    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }

  bestCar = cars.find((el) => el.y == Math.min(...cars.map((el) => el.y)));
  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);
  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, "red");
  }

  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx, "blue");
  }
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, "blue", true);
  carCtx.restore();

  // Show Network
  if (mode === "AI") {
    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
  } else {
    networkCanvas.style.display = "none";
  }
  rate.innerHTML = bestCar.y > 0 ? 0 : Math.ceil(bestCar.y * -1);
  start = requestAnimationFrame(animate);
  endGame(start, cars);
}

function endGame(start, cars) {
  if (typeof end === "undefined") {
    localStorage.setItem("end", bestCar.y + 1000);
    end = parseInt(localStorage.getItem("end"));
  } else {
    end -= 5;
  }

  if (cars.every((el) => el.isDestroy()) && bestCar.isDestroy()) {
    cancelAnimationFrame(start);
    pauseScreen.classList.add("gameover");
  }

  if (mode === "KEYS") {
    if (end <= bestCar.y) {
      cancelAnimationFrame(start);
      pauseScreen.classList.add("gameover");
    }
  } else {
    if (cars.every((el) => el.y >= end)) {
      cancelAnimationFrame(start);
      document.location.reload();
    }
  }
}
