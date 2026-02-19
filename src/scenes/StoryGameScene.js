export default class StoryGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "StoryGameScene" });
    this.ballOwner = null;
    this.westwardPlayers = [];
    this.northfieldPlayers = [];
    this.controlledPlayerIndex = 0;
    this.westwardGoalie = null;
    this.northfieldGoalie = null;
  }

  createTeams() {
    const scale = 0.25;

    const westwardPositions = [
      { x: 200, y: 300 },
      { x: 250, y: 200 },
      { x: 250, y: 400 },
      { x: 350, y: 150 },
      { x: 350, y: 450 },
      { x: 400, y: 250 },
      { x: 400, y: 350 }
    ];

    westwardPositions.forEach(pos => {
      const p = this.physics.add.sprite(pos.x, pos.y, "player_westward");
      p.setScale(scale);
      p.setCollideWorldBounds(true);
      this.westwardPlayers.push(p);
    });

    const westwardGoalie = this.physics.add.sprite(140, 300, "goalie_westward");
    westwardGoalie.setScale(scale);
    westwardGoalie.setCollideWorldBounds(true);
    this.westwardGoalie = westwardGoalie;

    const northfieldPositions = [
      { x: 800, y: 300 },
      { x: 750, y: 200 },
      { x: 750, y: 400 },
      { x: 650, y: 150 },
      { x: 650, y: 450 },
      { x: 600, y: 250 },
      { x: 600, y: 350 }
    ];

    northfieldPositions.forEach(pos => {
      const p = this.physics.add.sprite(pos.x, pos.y, "player_northfield");
      p.setScale(scale);
      p.setCollideWorldBounds(true);
      this.northfieldPlayers.push(p);
    });

    const northfieldGoalie = this.physics.add.sprite(860, 300, "goalie_northfield");
    northfieldGoalie.setScale(scale);
    northfieldGoalie.setCollideWorldBounds(true);
    this.northfieldGoalie = northfieldGoalie;
  }

  create() {
    this.keys = this.input.keyboard.addKeys({
      switch: Phaser.Input.Keyboard.KeyCodes.K,
      pass: Phaser.Input.Keyboard.KeyCodes.N,
      shoot: Phaser.Input.Keyboard.KeyCodes.M,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    const field = this.add.image(500, 300, "field");
    field.setDisplaySize(1000, 600);

    this.ball = this.physics.add.image(500, 300, "ball");
    this.ball.setCollideWorldBounds(true);
    this.ball.setScale(0.15);

    this.createTeams();

    this.playerMarker = this.add.triangle(0, 0, 0, 30, 15, 0, 30, 30, 0xffff00);
    this.playerMarker.setOrigin(0.5, 1);
    this.playerMarker.setDepth(10);

    this.add.text(500, 60, "Story Mode", {
      fontSize: "32px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    if (this.game.menuMusic) {
      this.game.menuMusic.stop();
      this.game.menuMusic = null;
    }
  }

  update() {
    if (!this.keys) return;
    this.handlePlayerControls();
    this.updateAI();

    const player = this.westwardPlayers[this.controlledPlayerIndex];
    if (player) {
      this.playerMarker.setPosition(player.x, player.y - 45);
    }
    this.checkBallPossession();
    this.dribbleBall();
    this.updateGoalies();

    if (Phaser.Input.Keyboard.JustDown(this.keys.switch)) {
      this.switchPlayer();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.pass)) {
      this.kickBall(250);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.shoot)) {
      this.kickBall(500);
    }
  }

  handlePlayerControls() {
    const player = this.westwardPlayers[this.controlledPlayerIndex];
    if (!player) return;

    const speed = 200;
    player.setVelocity(0);

    if (this.keys.left.isDown) player.setVelocityX(-speed);
    if (this.keys.right.isDown) player.setVelocityX(speed);
    if (this.keys.up.isDown) player.setVelocityY(-speed);
    if (this.keys.down.isDown) player.setVelocityY(speed);
  }

  switchPlayer() {
    if (!this.westwardPlayers || this.westwardPlayers.length === 0) return;
    const current = this.westwardPlayers[this.controlledPlayerIndex];
    if (current) current.setVelocity(0, 0);
    this.controlledPlayerIndex++;
    if (this.controlledPlayerIndex >= this.westwardPlayers.length) {
      this.controlledPlayerIndex = 0;
    }
    const newPlayer = this.westwardPlayers[this.controlledPlayerIndex];
    if (newPlayer) newPlayer.setVelocity(0, 0);
    console.log("Switched to player:", this.controlledPlayerIndex);
  }

  kickBall(power) {
    const player = this.westwardPlayers[this.controlledPlayerIndex];
    if (!player || !this.ball) return;
    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y);
    if (dist > 60) return;
    this.ballOwner = null;
    let dx = 1;
    let dy = 0;
    if (this.keys.left.isDown) { dx = -1; dy = 0; }
    else if (this.keys.right.isDown) { dx = 1; dy = 0; }
    else if (this.keys.up.isDown) { dx = 0; dy = -1; }
    else if (this.keys.down.isDown) { dx = 0; dy = 1; }
    this.ball.setVelocity(dx * power, dy * power);
  }

  checkBallPossession() {
    if (!this.ball) return;
    const player = this.westwardPlayers[this.controlledPlayerIndex];
    if (!player) return;
    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y);
    if (dist < 40) {
      this.ballOwner = player;
    }
  }

  dribbleBall() {
    if (!this.ballOwner) return;
    this.ball.setVelocity(0);
    this.ball.x = this.ballOwner.x + 20;
    this.ball.y = this.ballOwner.y;
  }

  updateGoalies() {
    if (!this.ball) return;
    if (this.westwardGoalie) {
      this.westwardGoalie.y = Phaser.Math.Clamp(this.ball.y, 230, 370);
    }
    if (this.northfieldGoalie) {
      this.northfieldGoalie.y = Phaser.Math.Clamp(this.ball.y, 230, 370);
    }
  }

  updateAI() {
    if (!this.ball) return;
    this.northfieldPlayers.forEach(ai => {
      const distToBall = Phaser.Math.Distance.Between(ai.x, ai.y, this.ball.x, this.ball.y);
      if (distToBall < 200) {
        this.physics.moveToObject(ai, this.ball, 120);
      } else {
        if (ai.homeX === undefined) ai.homeX = ai.x;
        if (ai.homeY === undefined) ai.homeY = ai.y;
        this.physics.moveTo(ai, ai.homeX, ai.homeY, 80);
      }
    });
  }

  startStory() {
    console.log("Story begins...");
  }
}