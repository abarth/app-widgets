(function(exports) {
'use strict';

function repeat(s, n) {
  return Array(n + 1).join(s);
}

function generateFakeDrawerData(numberOfItems) {
  var data = [];
  var i = 0;
  while (i < numberOfItems) {
    data[i] = {
      icon: 'communication:chat',
      label: repeat(String.fromCharCode(65 + i++), 5)
    };
  }
  data[i] = {icon: 'search', label: 'Search'};
  return data;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateFakeListData(numberOfItems) {
  var possibleAvatarColors = [
    'BurlyWood', 'green', 'orange', 'salmon', 'lightblue', 'BlueViolet', 'DarkSeaGreen',
  ];
  var possibleParticipants = [
    'Adam', 'Ojan', 'Elliott', 'Chris',
  ];
  var possibleTimes = [
    'Now', 'Yesterday', 'Last week',
  ];
  var possibleSubjects = [
    'Do you even bench?',
    'I like to scroll forever',
    'Lunch',
    'What if my subject is really long? Longer than that. Like really, really, long?',
  ];
  var possibleSnippets = [
    'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.',
    'When, in disgrace with fortune and men\'s eyes, I all alone beweep my outcast state,',
    'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility',
  ];

  var data = [];
  for (var i = 0; i < numberOfItems; ++i) {
    data[i] = {
      id: i,
      avatarColor: getRandomItem(possibleAvatarColors),
      participants: getRandomItem(possibleParticipants),
      time: getRandomItem(possibleTimes),
      subject: getRandomItem(possibleSubjects),
      snippet: getRandomItem(possibleSnippets),
    };
    data[i].avatarLetter = data[i].participants[0].toUpperCase();
  }
  return data;
}

function FakeDataProvider(numberOfItems) {
  // Create a HTMLUnknownElement and do not attach it to the DOM.
  this.dispatcher_ = document.createElement('FakeDataProvider-EventDispatcher');
  this.data_ = generateFakeListData(numberOfItems);
}

FakeDataProvider.prototype.addEventListener = function(type, callback, capture) {
  this.dispatcher_.addEventListener(type, callback, capture);
}

FakeDataProvider.prototype.removeEventListener = function(type, callback, capture) {
  this.dispatcher_.removeEventListener(type, callback, capture);
}

FakeDataProvider.prototype.dispatchEvent = function(e) {
  this.dispatcher_.dispatchEvent(e);
}

FakeDataProvider.prototype.getItemCount = function() {
  return this.data_.length;
}

FakeDataProvider.prototype.getItem = function(index) {
  return this.data_[index % this.data_.length];
}

FakeDataProvider.prototype.deleteItemByIds = function(ids) {
  self = this;
  ids.forEach(function(id) {
    self.data_.some(function(element, index) {
      if (element.id == id) {
        self.data_.splice(index, 1);
        return true;
      }
    })
  })
  var event = new CustomEvent("data-changed", { items: ids });
  this.dispatchEvent(event);
}

exports.FakeDataProvider = FakeDataProvider;
exports.fakeDrawerData = generateFakeDrawerData(26);

})(window);
