"use strict";

(function(exports) {

var kPhysicalRunway = 10;

function ScrollingEngine(options) {
  this.height_ = options.height;

  this.dataProvider_ = options.dataProvider;
  this.template_ = options.template;
  this.container_ = options.container;

  this.visibleCount_ = Math.ceil(this.container_.offsetHeight / this.height_);
  this.physicalCount_ = this.visibleCount_ + kPhysicalRunway;

  this.physicalHeight_ = this.height_ * this.physicalCount_;

  this.physicalData_ = new Array(this.physicalCount_);
  for (var i = 0; i < this.physicalCount_; ++i)
    this.physicalData_[i] = {};
  var exampleDatum = this.dataProvider_.getItem(0);
  this.propertyNames_ = Object.getOwnPropertyNames(exampleDatum);

  this.template_.model = this.physicalData_;

  Platform.endOfMicrotask(function() {
    this.physicalItems_ = new Array(this.physicalCount_);
    for (var i = 0, item = this.template_.nextElementSibling;
         item && i < this.physicalCount_;
         ++i, item = item.nextElementSibling) {
      this.physicalItems_[i] = item;
      item.transformValue_ = 0;
      this.updateItem_(i, i);
    }

    var self = this;
    this.container_.addEventListener('scroll', function(e) {
      self.onScroll_(e);
    });
    this.dataProvider_.addEventListener('data-changed', function(e) {
      self.refresh_(true);
    });
  }.bind(this));
}

ScrollingEngine.prototype.updateItem_ = function(virtualIndex, physicalIndex) {
  var virtualDatum = this.dataProvider_.getItem(virtualIndex);
  var physicalDatum = this.physicalData_[physicalIndex];

  for (var i = 0; i < this.propertyNames_.length; ++i) {
    var propertyName = this.propertyNames_[i];
    physicalDatum[propertyName] = virtualDatum[propertyName];
  }
};

ScrollingEngine.prototype.onScroll_ = function(e) {
  this.refresh_(false);
}

ScrollingEngine.prototype.refresh_ = function(force) {
  var scrollTop = this.container_.scrollTop;

  var firstVisibleIndex = Math.floor(scrollTop / this.height_);
  var visibleMidpoint = firstVisibleIndex + this.visibleCount_ / 2;

  var firstReifiedIndex = Math.max(0, Math.floor(visibleMidpoint - this.physicalCount_ / 2));
  firstReifiedIndex = Math.min(firstReifiedIndex, this.dataProvider_.getItemCount() - this.physicalCount_);

  var firstPhysicalIndex = firstReifiedIndex % this.physicalCount_;
  var baseVirtualIndex = firstReifiedIndex - firstPhysicalIndex;

  var baseTransformValue = Math.floor(this.height_ * baseVirtualIndex);
  var nextTransformValue = Math.floor(baseTransformValue + this.physicalHeight_);

  var baseTransformString = 'translate3d(0,' + baseTransformValue + 'px,0)';
  var nextTransformString = 'translate3d(0,' + nextTransformValue + 'px,0)';

  var self = this;
  window.requestAnimationFrame(function() {
    for (var i = 0; i < firstPhysicalIndex; ++i) {
      var item = self.physicalItems_[i];
      if (force || item.transformValue_ != nextTransformValue) {
        self.updateItem_(baseVirtualIndex + self.physicalCount_ + i, i);
        item.style.WebkitTransform = nextTransformString;
      }
      item.transformValue_ = nextTransformValue;
    }
    for (var i = firstPhysicalIndex; i < self.physicalCount_; ++i) {
      var item = self.physicalItems_[i];
      if (force || item.transformValue_ != baseTransformValue) {
        self.updateItem_(baseVirtualIndex + i, i);
        item.style.WebkitTransform = baseTransformString;
      }
      item.transformValue_ = baseTransformValue;
    }

    if (window.Platform)
      Platform.flush();
  });
};

exports.ScrollingEngine = ScrollingEngine;

})(window);
