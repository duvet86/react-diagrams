export default () => {
  if (!document.body.closest) {
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
      Element.prototype.closest = function(s: string) {
        let el: Element | null = this;
        if (!document.documentElement.contains(el)) {
          return null;
        }
        do {
          if (el.matches(s)) {
            return el;
          }
          el = (el.parentElement || el.parentNode) as Element;
        } while (el !== null && el.nodeType === 1);
        return null;
      };
    }
  }
};
