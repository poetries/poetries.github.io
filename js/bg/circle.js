var maxElements = 250;
var duration = 1500;
var toAnimate = [];
var radius = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
var distance = radius / 4 <= 150 ? 150 : radius / 4; 
var colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'];

var createElements = (function() {
  var fragment = document.createDocumentFragment();
  for (var i = 0; i < maxElements; i++) {
    var el = document.createElement('div');
    el.classList.add('particule');
    el.style.color = colors[anime.random(0, 3)];
    toAnimate.push(el);
    fragment.appendChild(el);
  }
  document.body.appendChild(fragment);
})();

var animate = function(el, i) {
  var angle = Math.random() * Math.PI * 2;
  anime({
    targets: el,
    translateX: [0, Math.cos(angle) * distance],
    translateY: [0, Math.sin(angle) * distance],
    scale: [
      {value: [0, 1], duration: 400, easing: 'easeOutBack'},
      {value: 0, duration: 400, delay: duration - 800, easing: 'easeInBack'}
    ],
    offset: (duration / maxElements) * i,
    duration: duration,
    easing: 'easeOutSine',
    loop: true
  });
}

toAnimate.forEach(animate);