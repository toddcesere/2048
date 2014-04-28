function HTMLActuator(grid) {
  this.gridContainer    = document.querySelector(".grid-container");
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  
  this.gameContainer = document.querySelector('.game-container');
  this.addCrossBrowserStyle(this.gameContainer, 'transition', '500ms ease-in-out');
  var properties = this.crossBrowserPrefix(['Transform', 'Transform', 'transform']);
  var values = ['-webkit-scale', '-moz-scale', 'scale'];
  for (var i = 0; i < properties.length; i++) {
    this.gameContainer.style[properties[i]] = values[i];
  }

  this.score = 0;
  this.grid = grid;
  this.tileMargin = 15;
}

HTMLActuator.prototype.actuate = function (metadata) {
  var self = this;
  var grid = self.grid;
  var tileSize = self.tileSize();
  var boundaries = this.grid.boundaries();
  var height = boundaries.y.max - boundaries.y.min + 1;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);
    self.clearContainer(self.gridContainer);
    
    self.gameContainer.style.height = (height * (tileSize + self.tileMargin))+"px";
    
    grid.containers.forEach(function (container) {
      var gridCell = document.createElement('div');
      self.setPosition(gridCell, container, -15);
      
      gridCell.style.width = tileSize+"px";
      gridCell.style.height = tileSize+"px";
      
      self.applyClasses(gridCell, ['grid-cell']);
      self.gridContainer.appendChild(gridCell);
    });

    grid.eachCell(function (x, y, cell) {
      if (cell) {
        self.addTile(cell);
      }
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;
  var tileSize = this.tileSize();

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  
  this.setPosition(wrapper, position, 0);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-"+tile.value];

  if (tile.value > 2048) classes.push("tile-super");
  if (tile.expander) classes.push("tile-expander");

  this.applyClasses(wrapper, classes);

  inner.style.width = tileSize+"px";
  inner.style.height = tileSize+"px";
  inner.style.fontSize = (tileSize / 2)+"px";
  inner.style.lineHeight = (tileSize + 15 / 2)+"px";
  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      self.setPosition(wrapper, tile, 0);
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.setPosition = function (element, position, offset) {
  var tileSize = this.tileSize();
  var boundaries = this.grid.boundaries();
  var value = 
    "translate("+
      ((position.x - boundaries.x.min) * (tileSize + 15) + offset)+"px, "+
      ((position.y - boundaries.y.min) * (tileSize + 15) + offset)+"px)";
  this.addCrossBrowserStyle(element, 'transform', value);
};

HTMLActuator.prototype.addCrossBrowserStyle = function (element, property, value) {
  var capitalized = property.charAt(0).toUpperCase()+property.slice(1);
  this.crossBrowserPrefix([capitalized, capitalized, property]).forEach(function (fullProperty) {
    element.style[fullProperty] = value;
  });
}

HTMLActuator.prototype.crossBrowserPrefix = function (bases) {
  return ['webkit'+bases[0], 'moz'+bases[1], ''+bases[2]];
}

HTMLActuator.prototype.tileSize = function () {
  var boundaries = this.grid.boundaries();
  var width = boundaries.x.max - boundaries.x.min + 1;
  var height = boundaries.y.max - boundaries.y.min + 1;
  size = (500 - 15) /(width > height ? width : height) - 15;
  return size;
}

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
