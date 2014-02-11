(function(exports) {
'use strict';

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateFakeListData() {
  var kNumberOfItems = 500;
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
  for (var i = 0; i < kNumberOfItems; ++i) {
    data[i] = {
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

function repeat(s, n) {
  return Array(n + 1).join(s);
}

function generateFakeDrawerData() {
  var kNumberOfItems = 26;
  var data = [];
  var i = 0;
  while (i < kNumberOfItems) {
    data[i] = {
      icon: 'dialog',
      label: repeat(String.fromCharCode(65 + i++), 5)
    };
  }
  data[i] = {icon: 'search', label: 'Search'};
  return data;
}

exports.fakeListData = generateFakeListData();
exports.fakeDrawerData = generateFakeDrawerData();

})(window);
