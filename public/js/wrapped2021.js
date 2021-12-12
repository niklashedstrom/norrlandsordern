
let currentSlide = 0;

const progressBars = document.getElementsByClassName('progress-wrapper')[0].getElementsByClassName('progress');
const slides = [...new Array(progressBars.length).keys()].map(i => document.getElementById(`slide${i+1}`));
progressBars[0].classList.add('progress-current');

function forward() {
  animationReset();
  if (currentSlide < progressBars.length - 1) {
    currentSlide++;
    updateProgressBars();
    updateSlides();
  } else {
    window.location.href = '/';
  }
}

function back() {
  animationReset();
  if (currentSlide > 0) {
    currentSlide--;
  } else {
    currentSlide = 0;
  }
  updateProgressBars();
  updateSlides();
}

let progressTimer = setInterval(forward, 20000);
let animationTimers;
let animationReset;

animate1();

function resetTimer() {
  animationTimers.forEach(timer => clearTimeout(timer));
  clearInterval(progressTimer);
  progressTimer = setInterval(forward, 20000);
}

document.getElementById('back').addEventListener('click', () => {
  resetTimer();
  back();
});

document.getElementById('forward').addEventListener('click', () => {
  resetTimer();
  forward();
});

function updateProgressBars() {
  for (let i = 0; i < progressBars.length; i++) {
    if (i < currentSlide) {
      progressBars[i].classList.add('progress-done');
      progressBars[i].classList.remove('progress-current');
    } else if ( i == currentSlide) {
      progressBars[i].classList.add('progress-current');
      progressBars[i].classList.remove('progress-done');
    } else {
      progressBars[i].classList.remove('progress-done');
      progressBars[i].classList.remove('progress-current');
    }
  }
}

const animations = [
  animate1,
  animate2,
  animate3,
  animate4,
  animate5,
  animate6,
  animate7,
]

function updateSlides() {
  slides.forEach((slide, i) => {
    if (i == currentSlide) {
      slide.classList.remove('hidden');
      animations[i]();
    } else {
      slide.classList.add('hidden');
    }
  });
}

function slidein(elem) {
  elem.classList.remove('slidein');
  elem.classList.remove('slideout');
  elem.classList.add('slidein');
}

function slideout(elem) {
  elem.classList.remove('slidein');
  elem.classList.remove('slideout');
  elem.classList.add('slideout');
}

function fadein(elem) {
  elem.classList.remove('fadein');
  elem.classList.remove('fadeout');
  elem.classList.add('fadein');
}

function fadeout(elem) {
  elem.classList.remove('fadein');
  elem.classList.remove('fadeout');
  elem.classList.add('fadeout');
}

function animate1() {
  const slide = slides[0];
  const slider = document.getElementById('slider1');
  const slider2 = document.getElementById('slider2');
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider.classList.remove('slideout', 'slidein');
    slider2.classList.remove('slideout', 'slidein');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [2000, () => slideout(slider)],
    [3000, () => fadein(texts[0])],
    [8000, () => slidein(slider)],
    [9000, () => fadein(texts[1])],
    [13000, () => fadeout(texts[1])],
    [15000, () => fadein(texts[2])],
    [19000, () => slidein(slider2)],
  ]
  startAnimation(steps);
}

function animate2() {
  const slide = slides[1];
  const slider3 = document.getElementById('slider3');
  const slider4 = document.getElementById('slider4');
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider3.classList.remove('slideout', 'slidein');
    slider4.classList.remove('slideout', 'slidein');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [1000, () => fadein(texts[0])],
    [2000, () => fadein(texts[1])],
    [5000, () => fadeout(texts[0])],
    [5000, () => fadeout(texts[1])],
    [6000, () => fadein(texts[2])],
    [7000, () => fadein(texts[3])],
    [12000, () => slidein(slider3)],
    [12000, () => fadein(texts[4])],
    [19000, () => slidein(slider4)],
  ];
  startAnimation(steps);
}

function animate3() {
  const slide = slides[2];
  const slider5 = document.getElementById('slider5');
  const slider6 = document.getElementById('slider6');
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider5.classList.remove('slideout', 'slidein');
    slider6.classList.remove('slideout', 'slidein');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [0000, () => fadein(texts[0])],
    [3500, () => fadeout(texts[0])],
    [4000, () => fadein(texts[1])],
    [10000, () => slidein(slider5)],
    [10000, () => fadein(texts[2])],
    [14000, () => fadeout(texts[2])],
    [14500, () => fadein(texts[3])],
    [19000, () => slidein(slider6)],
  ];
  startAnimation(steps);
}

function animate4() {
  const slide = slides[3];
  const slider7 = document.getElementById('slider7');
  const snake = slide.getElementsByClassName('snake')[0];
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider7.classList.remove('slideout', 'slidein');
    snake.classList.add('hidden');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [1000, () => fadein(texts[0])],
    [5000, () => fadeout(texts[0])],
    [5000, () => snake.classList.remove('hidden')],
    [6000, () => fadein(texts[1])],
    [13000, () => fadeout(texts[1])],
    [14000, () => fadein(texts[2])],
    [19000, () => slidein(slider7)],
  ];
  startAnimation(steps);
}

function animate5() {
  const slide = slides[4];
  const slider8 = document.getElementById('slider8');
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider8.classList.remove('slideout', 'slidein');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [0000, () => fadein(texts[0])],
    [4000, () => fadeout(texts[0])],
    [5000, () => fadein(texts[1])],
    [10000, () => fadeout(texts[1])],
    [11000, () => fadein(texts[2])],
    [19000, () => slidein(slider8)],
  ];
  startAnimation(steps);
}

function animate6() {
  const slide = slides[5];
  const slider9 = document.getElementById('slider9');
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider9.classList.remove('slideout', 'slidein');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [1000, () => fadein(texts[0])],
    [5000, () => fadeout(texts[0])],
    [6000, () => fadein(texts[1])],
    [19000, () => slidein(slider9)],
  ];
  startAnimation(steps);
}

function animate7() {
  const slide = slides[6];
  const slider10 = document.getElementById('slider10');
  const texts = [...slide.getElementsByClassName('centered')];

  animationReset = () => {
    slider10.classList.remove('slideout', 'slidein');
    texts.forEach(t => t.classList.remove('fadein', 'fadeout'))
  }

  const steps = [
    [1000, () => slideout(slider10)],
    [2000, () => fadein(texts[0])],
    [7000, () => fadeout(texts[0])],
    [8000, () => fadein(texts[1])],
  ];
  startAnimation(steps);
}

function startAnimation(steps) {
  animationTimers = steps.map(step => setTimeout(step[1], step[0]));
}