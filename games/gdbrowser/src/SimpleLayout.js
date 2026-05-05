import * as PIXI from "pixi.js";
import {SceneComponent} from "./SceneSystem";

// A simple layout manager I wrote because pixi-layout just wasn't doing it for me.
// Layout syntax (specified in this.layout): {
//   gap: padding between elements (default {x: 0, y: 0} = 0),
//   rowLength: maximum items in a row (default 0 = no limit),
//   centerRows: if rows should be centered (default false),
//   centerItems: if items should be vertically centered in rows (default false),
//   fromBottom: if rows should go from bottom to top (default false)
// }

export default class SimpleLayout extends SceneComponent {
  _setup() {
    this.anchorSet = false;
    this.anchor = new PIXI.ObservablePoint({
      _onUpdate: () => {this.anchorUpdated()}
    });
  }

  updateLayout() {
    if (!this.layout) {
      // The bounds should already be calculated in this case
      this.layoutWidth = this.width;
      this.layoutHeight = this.height;
      this.updateWithAnchor();
      return;
    };

    const gap = this.layout.gap || 0;
    const horizontalGap = typeof gap === "number" ? gap : gap.x;
    const verticalGap = typeof gap === "number" ? gap : gap.y;
    const rowLength = this.layout.rowLength || 0;

    this.layoutWidth = 0;
    this.layoutHeight = 0;
    let currentX = 0;
    let currentY = 0;
    const rows = [];
    const currentRow = {
      children: [],
      width: 0,
      height: 0
    };

    const pushRow = () => {
      currentRow.width -= horizontalGap;
      rows.push({
        children: currentRow.children,
        width: currentRow.width,
        height: currentRow.height
      });

      this.layoutWidth = Math.max(this.layoutWidth, currentRow.width);
      this.layoutHeight += currentRow.height + verticalGap;

      currentX = 0;
      currentY += currentRow.height + verticalGap;

      // Vertically center items in a row
      if (this.layout.centerItems && currentRow.children.length > 1) {
        currentRow.children.forEach(child => {
          child.y += (currentRow.height - child.height) / 2;
        });
      }
    };

    this.children.forEach(child => {
      const childBounds = child.getBounds();
      const childWidth = childBounds.width;
      const childHeight = childBounds.height;

      child.position.set(currentX, currentY);
      currentX += childWidth + horizontalGap;

      currentRow.children.push(child);
      currentRow.width += childWidth + horizontalGap;
      currentRow.height = Math.max(currentRow.height, childHeight);

      if (rowLength && currentRow.children.length === rowLength) {
        pushRow();
        currentRow.children = [];
        currentRow.width = 0;
        currentRow.height = 0;
      }
    });

    if (currentRow.children.length > 0)
      pushRow();

    this.layoutHeight -= verticalGap;

    // Center rows horizontally
    if (this.layout.centerRows && rows.length > 1) {
      for (const row of rows) {
        row.children.forEach(child => {
          child.x += (this.layoutWidth - row.width) / 2;
        });
      }
    }

    // Flip everything upside down if rows should go bottom-to-top
    if (this.layout.fromBottom) {
      this.children.forEach(child => {
        child.y *= -1;
      });
    }
  }

  anchorUpdated() {
    this.anchorSet = true;
    this.updateWithAnchor();
  }

  updateWithAnchor() {
    // Don't move children if an anchor was never set
    if (!this.anchorSet) return;

    const anchorX = this.anchor.x;
    const anchorY = this.anchor.y;

    // Shift all children so that everything is relative to
    // the top-left of the layout container
    const bounds = this.getBounds();
    this.children.forEach(child => {
      if (anchorX !== 0) child.x -= bounds.minX;
      if (anchorY !== 0) child.y -= bounds.minY;
    });

    this.pivot.set(
      this.layoutWidth * anchorX,
      this.layoutHeight * anchorY
    );
  }
}
