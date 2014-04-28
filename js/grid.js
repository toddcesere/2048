function Grid(size, previousState) {
  this.size = size;
  if (previousState) {
    this.cells = this.fromState(previousState);
  } else {
    this.cells = this.empty();
  } 
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];
  this.containers = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      this.containers.push({x: x, y: y});
      row.push(null);
    }
  }
  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];
  
  this.containers = state.containers;
  
  this.containers.forEach(function (position) {
    var x = position.x;
    if (!cells[x]) {
      cells[x] = [];
    }
    var tile = state.cells[x][position.y];
    if (tile) {
      newTile = new Tile(tile.position, tile.value);
      newTile.expander = tile.expander;
    } else {
      newTile = null;
    }
    cells[x][position.y] = newTile;
  });

  return cells;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  var self = this;
  self.containers.forEach(function (container) {
    callback(container.x, container.y, self.cells[container.x][container.y]);
  });
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  var within = false;
  this.eachCell(function (x, y, cell) {
    within = within || (position.x == x && position.y == y);
  });
  return within;
};

Grid.prototype.serialize = function () {
  var cellState = [];
  
  this.eachCell(function(x, y, cell) {
    if (!cellState[x]) {
      cellState[x] = [];
    }
    cellState[x][y] = cell ? cell.serialize() : null;
  });

  return {
    cells: cellState,
    containers: this.containers
  };
};

Grid.prototype.boundaries = function() {
  var boundaries = {x: {min: 0, max: 0}, y: {min: 0, max: 0}};
  this.eachCell(function (x, y, cell) {
    [[x, 'x'], [y, 'y']].forEach(function(dimension) {
      var boundary = boundaries[dimension[1]];
      var position = dimension[0];
      if (position < boundary.min) {
        boundary.min = position;
      }
      if (position > boundary.max) {
        boundary.max = position;
      }
    });
  });
  return boundaries;
}
