"use strict";

(function(exports) {

var kPhysicalCount = 10;

function ScrollingEngine(options) {
  this.height_ = options.height;
  this.count_ = options.count;
  this.dataProvider_ = options.dataProvider;
  this.template_ = options.template;
  this.container_ = options.container;

  this.physicalData_ = new Array(kPhysicalCount);
  for (var i = 0; i < kPhysicalCount; ++i)
    this.physicalData_[i] = {};
  var exampleDatum = this.dataProvider_(0);
  this.propertyNames_ = Object.getOwnPropertyNames(exampleDatum);

  this.template_.model = this.physicalData_;

  // TODO(abarth): What should we do here with Object.observe?
  if (window.Platform)
    Platform.performMicrotaskCheckpoint();

  this.physicalItems_ = new Array(kPhysicalCount);
  for (var i = 0, item = this.template_.nextElementSibling;
       item && i < kPhysicalCount;
       ++i, item = item.nextElementSibling) {
    this.physicalItems_[i] = item;
    item.transformValue_ = 0;
    this.updateItem_(i, i);
  }

  this.physicalHeight_ = this.height_ * kPhysicalCount;
  this.visibleItemCount_ = Math.ceil(this.container_.offsetHeight / this.height_);

  var self = this;
  this.container_.addEventListener('scroll', function(e) {
    self.onScroll_(e);
  });
}

ScrollingEngine.prototype.updateItem_ = function(virtualIndex, physicalIndex) {
  var virtualDatum = this.dataProvider_(virtualIndex);
  var physicalDatum = this.physicalData_[physicalIndex];

  for (var i = 0; i < this.propertyNames_.length; ++i) {
    var propertyName = this.propertyNames_[i];
    physicalDatum[propertyName] = virtualDatum[propertyName];
  }
};

ScrollingEngine.prototype.onScroll_ = function(e) {
  var scrollTop = this.container_.scrollTop;

  var firstVisibleIndex = Math.floor(scrollTop / this.height_);
  var visibleMidpoint = firstVisibleIndex + this.visibleItemCount_ / 2;

  var firstReifiedIndex = Math.max(0, Math.floor(visibleMidpoint - kPhysicalCount / 2));
  firstReifiedIndex = Math.min(firstReifiedIndex, this.count_ - kPhysicalCount);

  var firstPhysicalIndex = firstReifiedIndex % kPhysicalCount;
  var baseVirtualIndex = firstReifiedIndex - firstPhysicalIndex;

  var baseTransformValue = this.height_ * baseVirtualIndex;
  var nextTransformValue = baseTransformValue + this.physicalHeight_;

  var baseTransformString = 'translate3d(0,' + baseTransformValue + 'px,0)';
  var nextTransformString = 'translate3d(0,' + nextTransformValue + 'px,0)';

  var self = this;
  window.requestAnimationFrame(function() {
    for (var i = 0; i < firstPhysicalIndex; ++i) {
      var item = self.physicalItems_[i];
      if (item.transformValue_ != nextTransformValue) {
        self.updateItem_(baseVirtualIndex + kPhysicalCount + i, i);
        item.style.WebkitTransform = nextTransformString;
      }
      item.transformValue_ = nextTransformValue;
    }
    for (var i = firstPhysicalIndex; i < kPhysicalCount; ++i) {
      var item = self.physicalItems_[i];
      if (item.transformValue_ != baseTransformValue) {
        self.updateItem_(baseVirtualIndex + i, i);
        item.style.WebkitTransform = baseTransformString;
      }
      item.transformValue_ = baseTransformValue;
    }

    if (window.Platform)
      Platform.performMicrotaskCheckpoint();
  });
};

exports.ScrollingEngine = ScrollingEngine;

})(window);
