(function(exports) {

function Animator(delegate) {
    this.delegate = delegate;
    this.startTimeStamp = 0;
    this.request_ = null;
};

Animator.prototype.scheduleAnimation_ = function() {
    this.request_ = requestAnimationFrame(this.onAnimation_.bind(this));
};

Animator.prototype.startAnimation = function() {
    this.startTimeStamp = 0;
    this.scheduleAnimation_();
};

Animator.prototype.stopAnimation = function() {
    cancelAnimationFrame(this.request_);
    this.startTimeStamp = 0;
    this.request_ = null;
};

Animator.prototype.onAnimation_ = function(timeStamp) {
    if (!this.startTimeStamp)
        this.startTimeStamp = timeStamp;
    if (this.delegate.onAnimation(timeStamp))
        this.scheduleAnimation_();
};

function VelocityTracker() {
    this.recentTouchMoves_ = [];
    this.velocityX = 0;
    this.velocityY = 0;
}

VelocityTracker.kTimeWindow = 50;

VelocityTracker.prototype.pruneHistory_ = function(timeStamp) {
    for (var i = 0; i < this.recentTouchMoves_.length; ++i) {
        if (this.recentTouchMoves_[i].timeStamp > timeStamp - VelocityTracker.kTimeWindow) {
            this.recentTouchMoves_ = this.recentTouchMoves_.slice(i);
            return;
        }
    }
    // All touchmoves are old.
    this.recentTouchMoves_ = [];
};

VelocityTracker.prototype.update_ = function(e) {
    this.pruneHistory_(e.timeStamp);
    this.recentTouchMoves_.push(e);

    var oldestTouchMove = this.recentTouchMoves_[0];

    var deltaX = e.changedTouches[0].clientX - oldestTouchMove.changedTouches[0].clientX;
    var deltaY = e.changedTouches[0].clientY - oldestTouchMove.changedTouches[0].clientY;
    var deltaT = e.timeStamp - oldestTouchMove.timeStamp;

    if (deltaT > 0) {
        this.velocityX = deltaX / deltaT;
        this.velocityY = deltaY / deltaT;
    } else {
        this.velocityX = 0;
        this.velocityY = 0;
    }
};

VelocityTracker.prototype.onTouchStart = function(e) {
    this.recentTouchMoves_.push(e);
    this.velocityX = 0;
    this.velocityY = 0;
};

VelocityTracker.prototype.onTouchMove = function(e) {
    this.update_(e);
};

VelocityTracker.prototype.onTouchEnd = function(e) {
    this.update_(e);
    this.recentTouchMoves_ = [];
};

function DrawerController(options) {
    this.velocityTracker = new VelocityTracker();
    this.animator = new Animator(this);

    this.target = options.target;
    this.left = options.left;
    this.right = options.right;
    this.position = options.position;

    this.willOpenCallback = options.willOpen;
    this.didCloseCallback = options.didClose;
    this.animateCallback = options.onAnimate;

    this.state = DrawerController.kClosed;

    this.defaultAnimationSpeed = (this.right - this.left) / DrawerController.kBaseSettleDurationMS;

    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.target.addEventListener('touchstart', this.onTouchStart.bind(this));
}

DrawerController.kOpened = 'opened';
DrawerController.kClosed = 'closed';
DrawerController.kOpening = 'opening';
DrawerController.kClosing = 'closing';
DrawerController.kDragging = 'dragging';
DrawerController.kFlinging = 'flinging';

DrawerController.kBaseSettleDurationMS = 246;
DrawerController.kMaxSettleDurationMS = 600;

DrawerController.kMinFlingVelocity = 0.4;  // Matches Android framework.
DrawerController.kTouchSlop = 5;  // Matches Android framework.
DrawerController.kTouchSlopSquare = DrawerController.kTouchSlop * DrawerController.kTouchSlop;

DrawerController.prototype.restrictToCurrent = function(offset) {
    return Math.max(this.left, Math.min(this.position, offset));
};

DrawerController.prototype.restrictToBounds = function(offset) {
    return Math.max(this.left, Math.min(this.right, offset));
};

DrawerController.prototype.onTouchStart = function(e) {
    this.velocityTracker.onTouchStart(e);

    var touchX = e.changedTouches[0].clientX;
    var touchY = e.changedTouches[0].clientY;

    if (this.state != DrawerController.kOpened) {
        if (touchX != this.restrictToCurrent(touchX))
            return;
        this.state = DrawerController.kDragging;
    }

    this.animator.stopAnimation();
    this.target.addEventListener('touchmove', this.onTouchMove);
    this.target.addEventListener('touchend', this.onTouchEnd);

    this.startX = touchX;
    this.startY = touchY;
    this.startPosition = this.position;
    this.touchBaseX = Math.min(touchX, this.startPosition);
};

DrawerController.prototype.onTouchMove = function(e) {
    this.velocityTracker.onTouchMove(e);

    if (this.state == DrawerController.kOpened) {
        var deltaX = e.changedTouches[0].clientX - this.startX;
        var deltaY = e.changedTouches[0].clientY - this.startY;

        if (deltaX * deltaX + deltaY * deltaY < DrawerController.kTouchSlopSquare) {
            e.preventDefault();
            return;
        }

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            this.target.removeEventListener('touchmove', this.onTouchMove);
            this.target.removeEventListener('touchend', this.onTouchEnd);
            return;
        }

        this.state = DrawerController.kDragging;
    }

    e.preventDefault();
    var touchDeltaX = e.changedTouches[0].clientX - this.touchBaseX;
    this.position = this.restrictToBounds(this.startPosition + touchDeltaX);
    this.animateCallback.call(this.target, this.position);
};

DrawerController.prototype.onTouchEnd = function(e) {
    this.velocityTracker.onTouchEnd(e);
    this.target.removeEventListener('touchmove', this.onTouchMove);
    this.target.removeEventListener('touchend', this.onTouchEnd);

    var velocityX = this.velocityTracker.velocityX;
    if (Math.abs(velocityX) > DrawerController.kMinFlingVelocity) {
        this.state = DrawerController.kFlinging;
        this.fling(velocityX);
    } else if (this.isOpen()) {
        this.open();
    } else {
        this.close();
    }
};

DrawerController.prototype.isOpen = function() {
    return this.openFraction() >= 0.5;
};

DrawerController.prototype.toggle = function() {
    if (this.isOpen())
        this.close();
    else
        this.open();
};

DrawerController.prototype.open = function() {
    if (!this.position)
        this.willOpenCallback();

    this.animationStartFraction = this.openFraction();
    this.state = DrawerController.kOpening;
    this.fling(this.defaultAnimationSpeed);
};

DrawerController.prototype.close = function() {
    this.animationStartFraction = 1 - this.openFraction();
    this.state = DrawerController.kClosing;
    this.fling(-this.defaultAnimationSpeed);
};

DrawerController.prototype.openFraction = function() {
    var width = this.right - this.left;
    var offset = this.position - this.left;
    return offset / width;
};

DrawerController.prototype.fling = function(velocityX) {
    this.positionAnimationBase = this.position;
    this.animationVelocityX = velocityX;
    this.animator.startAnimation();
};

DrawerController.prototype.onAnimation = function(timeStamp) {
    var deltaT = timeStamp - this.animator.startTimeStamp;
    var deltaX = this.animationVelocityX * deltaT;
    var targetPosition = this.positionAnimationBase + deltaX;
    this.position = this.restrictToBounds(targetPosition);

    this.animateCallback.call(this.target, this.position);

    if (targetPosition <= this.left && this.animationVelocityX < 0) {
        this.state = DrawerController.kClosed;
        this.didCloseCallback();
        return false;
    }
    if (targetPosition >= this.right && this.animationVelocityX > 0) {
        this.state = DrawerController.kOpened;
        return false;
    }

    return true;
};

exports.DrawerController = DrawerController;

})(window);
