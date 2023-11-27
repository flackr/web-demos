class ScrollSnap {
  #scroller = null;
  #enabled = null;
  #lastY = 0;
  #ranges = [];
  mode = "native";

  constructor(scroller) {
    this.#scroller = scroller;
    const resizeObserver = new ResizeObserver(() => {this.update();});
    resizeObserver.observe(this.#scroller);
  }

  update = (mode) => {
    this.mode = mode || this.mode;
    const scrollerHeight = this.#scroller.clientHeight;
    let getTop = (element) => {
      let y = 0;
      while (element != this.#scroller) {
        y += element.offsetTop;
        element = element.offsetParent;
      }
      return y;
    }
    let clampOffset = (offset) => {
      return Math.max(0, Math.min(this.#scroller.scrollHeight - scrollerHeight, offset));
    }
    let convertRange = (range) => {
      const align = range[2];
      const height = Math.max(0, range[1] - range[0] - scrollerHeight);
      let start = range[0];
      // Only need to modify start if the range is larger than the scroller.
      const gap = Math.max(0, scrollerHeight - (range[1] - range[0]));
      if (gap >= 0) {
        if (align == 'end') {
          start -= gap;
        } else if (align == 'center') {
          start -= gap / 2;
        }
      }
      return [clampOffset(start), clampOffset(start + height)];
    };
    let getSnapRanges = (element) => {
      let children = element.children;
      let ranges = [];
      for (let child of children) {
        let align = getComputedStyle(child).scrollSnapAlign;
        if (align != 'none') {
          let start = getTop(child);
          const bottom = start + child.offsetHeight;
          const innerRanges = getSnapRanges(child);
          for (let i = 0; i < innerRanges.length; ++i) {
            const innerRange = innerRanges[i];
            const nextOuterEnd = i < innerRanges.length - 1 ? innerRanges[i + 1][0] : bottom;
            const innerAlign = innerRange[2];
            const innerHeight = innerRange[1] - innerRange[0];
            let gapBefore = 0;
            let gapAfter = 0;
            if (innerHeight < scrollerHeight) {
              // Distribute the gap between gapBefore and gapAfter.
              const gap = scrollerHeight - innerHeight;
              if (innerAlign == 'center') {
                gapBefore = gapAfter = gap / 2;
              } else if (innerAlign == 'start') {
                gapAfter = gap;
              } else {
                gapBefore = gap;
              }
            }
            if (this.mode == "join-short-both" && i == 0 &&
                innerRange[0] - start < scrollerHeight) {
              innerRange[0] = start;
            }
            if (innerRange[0] > start) {
              let overlap = this.mode == "proportional" ? gapAfter : 0;
              ranges.push([start, innerRange[0] + overlap, align]);
            }
            const joinInnerRange = this.mode == "join" || (
                (this.mode == "join-short" || this.mode == "join-short-both") && nextOuterEnd - innerRange[1] < scrollerHeight);
            if (joinInnerRange) {
              // Join with the inner range, assumings its alignment.
              start = innerRange[0];
              align = innerAlign;
            } else {
              // Avoid the inner range.
              ranges.push(innerRange);
              let overlap = this.mode == "proportional" ? gapBefore : 0;
              start = innerRange[1] - overlap;
            }
          }
          if (innerRanges.length == 0 || start < bottom)
            ranges.push([start, bottom, align]);
        } else {
          ranges.splice(ranges.length, 0, ...getSnapRanges(child));
        }
      }
      return ranges.sort((r1, r2) => {return r1[0] - r2[0];});
    };
    this.#ranges = getSnapRanges(this.#scroller).map(convertRange).sort((r1, r2) => {return r1[0] - r2[0]});
    if (this.mode == "native") {
      this.disable();
    } else {
      this.enable();
      this.onScrollEnd();
    }
  }

  enable() {
    if (this.#enabled)
      return;
    this.#enabled = {
      scrollSnapType: this.#scroller.style.scrollSnapType
    };
    this.#lastY = this.#scroller.scrollTop;
    this.#scroller.style.scrollSnapType = 'none';
    this.#scroller.addEventListener('scrollend', this.onScrollEnd);
  }

  disable() {
    if (!this.#enabled)
      return;
    this.#scroller.style.scrollSnapType = this.#enabled.scrollSnapType;
    this.#enabled = null;
    this.#scroller.removeEventListener('scrollend', this.onScrollEnd);
  }

  onScrollEnd = () => {
    const slop = 1;
    const pos = this.#scroller.scrollTop;
    const dir = pos - this.#lastY;
    if (Math.abs(dir) < slop) {
      this.#lastY = pos;
      return;
    }

    let i = 0;
    while (i < this.#ranges.length - 1 && this.#ranges[i][1] + slop < pos) {
      ++i;
    }
    // If we're between ranges then choose the range matching the current direction.
    if (i > 0 && this.#ranges[i][0] + slop > pos) {
      if (dir < 0)
        i--;
    }
    const target = Math.max(this.#ranges[i][0], Math.min(this.#ranges[i][1], pos));
    if (Math.abs(target - pos) > slop)
      this.#scroller.scrollTo({top: target, behavior: 'smooth'});
    this.#lastY = target;
  }
}
