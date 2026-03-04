export class NumberLabel {
  constructor(el) {
    this.el = el; // DOM element to update
    this.value = 0;
  }

  setNum(num) {
    this.value = num;
    let s = '000000' + num;
    this.el.textContent = s.substring(s.length - 6);
  }
}
