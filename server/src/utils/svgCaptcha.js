const svgCaptcha = require('svg-captcha');

const generateSvgCaptcha = () => {
  return svgCaptcha.create({
    size: 4,
    noise: 3,
    color: true,
    background: '#f0f0f0',
    width: 120,
    height: 40,
    fontSize: 40
  });
};

module.exports = {
  generateSvgCaptcha
};
