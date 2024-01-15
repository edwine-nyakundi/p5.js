// Global variables
let bubbles = []; // Array to store bubble objects
let repellers = []; // Array to store repeller objects
let freeze = false; // Flag for freezing bubble movement (activated by spacebar)
let greyOut = false; // Flag for grey out effect on bubbles (activated by 'A' key)
let useMicrophone = false; // Flag to use microphone for bubble size (activated by 'S' key)
let showRepeller = false; // Flag to show/hide repellers (activated by 'D' key)
let alignInSinWave = false; // Flag for aligning bubbles in a sin wave (activated by 'C' key)
let offSet = 0; // Offset for sin wave calculation
let mic; // Variable to store microphone input

// Importing classes from toxiclibs.js library for physics-based movement
let { Vec2D, Rect } = toxi.geom;
let { VerletPhysics2D, VerletParticle2D, VerletSpring2D } = toxi.physics2d;
let { GravityBehavior } = toxi.physics2d.behaviors;

let elasticActive = false; // Flag for elastic behavior (activated by 'X' key)
let springs = []; // Array to store spring objects for elastic behavior

let physics; // Variable for Verlet physics engine
let pos; // Position vector for elastic particles
let particles = []; // Array to store elastic particles

// Setup function - called once when the sketch starts
function setup() {
  createCanvas(800, 400); // Create canvas of size 800x400
  fill(255, 200); // Set fill color for shapes
  noStroke(); // Disable stroke for shapes
  colorMode(HSB); // Set color mode to HSB
  mic = new p5.AudioIn(); // Create a new Audio Input
  mic.start(); // Start the microphone input

  // Initialize Verlet physics engine
  physics = new VerletPhysics2D();
  physics.setWorldBounds(new Rect(0, 0, width, height)); // Set world bounds for physics
}

// Draw function - continuously executed to render the sketch
function draw() {
  background(25, 50); // Set background color
  let vol = mic.getLevel(); // Get volume level from microphone

  // Elastic behavior logic
  if (elasticActive) {
    physics.update(); // Update the physics engine

    stroke(0); // Set stroke color for shapes
    noFill(); // Disable fill for shapes
    beginShape(); // Begin a new shape
    for (let particle of particles) {
      vertex(particle.x, particle.y); // Create vertices for elastic line
    }
    endShape(); // End the shape

    particles[particles.length - 1].show(); // Show the last particle

    // Move particle according to mouse if pressed
    if (mouseIsPressed) {
      particles[particles.length - 1].lock(); // Lock the particle position
      particles[particles.length - 1].x = mouseX; // Set X position to mouseX
      particles[particles.length - 1].y = mouseY; // Set Y position to mouseY
      particles[particles.length - 1].unlock(); // Unlock the particle position

      // Check distance and explode if it exceeds threshold
      if (dist(particles[particles.length - 1].x, particles[particles.length - 1].y, pos.x, pos.y) > 400) {
        for (let i = 0; i < 10; i++) {
          let newBubble = new Bubble(mouseX, mouseY, random(10, 20));
          bubbles.push(newBubble);
        }
        elasticActive = false;
        for (let spring of springs) {
          physics.removeSpring(spring);
        }
        particles = [];
      }
    }
  }

  // Sin wave alignment logic
  if (alignInSinWave) {
    alignBubblesInSinWave();
  } else {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      if (!freeze) {
        bubbles[i].move();
      }
      if (useMicrophone) {
        bubbles[i].changeSize(vol);
      }
      bubbles[i].display();
      if (bubbles[i].done()) {
        bubbles.splice(i, 1);
      }
    }
  }
  if (showRepeller) {
    for (let repeller of repellers) {
      repeller.show();
      for (let bubble of bubbles) {
        repeller.repel(bubble);
        // bubble.applyForce(repelForce);
      }
    }
  }
}

function mouseDragged() {
  if (!elasticActive) {
    let newBubble = new Bubble(mouseX, mouseY, random(30, 60));
    bubbles.push(newBubble);
  }
}
function activateElasticBehavior() {
  elasticActive = !elasticActive;
  if (elasticActive) {
    // Attach springs to bubbles
    attachSpringsToBubbles();
  } else {
    // Remove springs from physics world
    for (let spring of springs) {
      physics.removeSpring(spring);
    }
    particles = [];
  }
}
function attachSpringsToBubbles() {
  // particles=[]
  pos = createVector(random(width * 0.3, width * 0.7), 0);
  physics.addBehavior(new GravityBehavior(new Vec2D(0, 0.5)));

  let spacing = 10;
  let total = 20;
  for (let i = 0; i < total; i++) {
    //{!1} Spacing them out along the x-axis
    let particle = new Particle(pos.x + i * spacing, 0, 20);
    //{!1} Add the particle to the physics world.
    physics.addParticle(particle);
    //{!1} Add the particle to the array.
    particles.push(particle);
  }

  for (let i = 0; i < total - 1; i++) {
    let spring = new VerletSpring2D(
      particles[i],
      particles[i + 1],
      spacing,
      0.2
    );
    springs.push(spring);
    physics.addSpring(spring);
  }

  particles[0].lock();
}

// Function to handle key presses for various functionalities
function keyPressed() {
  if (key === " ") {
    freeze = !freeze; // Toggle freeze functionality with the space bar
  }
  if (key === "A" || key == "a") {
    greyOut = !greyOut; // Toggle grey out effect with the 'A' key
  }
  if (key === "C" || key === "c") {
    // alignInSinWave = !alignInSinWave; // Toggle sin wave alignment with the 'C' key
  }
  if (key === "S" || key == "s") {
    useMicrophone = !useMicrophone; // Toggle microphone effect with the 'S' key
  }
  if (key === "D" || key === "d") {
    showRepeller = !showRepeller; // Toggle display of repellers with the 'D' key
    repellers = []; // Clear existing repellers
    for (let i = 0; i < 10; i++) {
      let repeller = new Repeller(random(width), random(height)); // Create new repellers
      repellers.push(repeller);
    }
  }

  if (key === "X" || key === "x") {
    activateElasticBehavior(); // Activate elastic behavior with the 'X' key
  }
}

// Bubble class defining the properties and behaviors of a bubble
class Bubble {
  constructor(x, y, r) {
    this.position = createVector(x, y); // Position vector of the bubble
    this.radius = r; // Radius of the bubble
    this.velocity = createVector(random(-3, 3), 0); // Initial velocity vector
    this.acceleration = createVector(0, 0.2); // Acceleration vector
    this.lifespan = 255; // Lifespan for fading effect
    this.bounceCount = 0; // Count of how many times the bubble has bounced
    this.maxBounces = round(random(3, 5)); // Maximum number of bounces before bursting
    this.color = color(random(255), random(100, 255), 100); // Random color for the bubble
  }

  // Method to update the bubble's movement
  move() {
    if (!greyOut) {
      this.velocity.add(this.acceleration); // Apply acceleration to velocity
      this.position.add(this.velocity); // Update position based on velocity

      // Check if the bubble hits the ground
      if (this.position.y + this.radius > height) {
        this.position.y = height - this.radius; // Adjust position
        this.velocity.y *= -0.6; // Damping effect for bounce
        this.bounceCount++; // Increment bounce count

        // Check if max bounces are reached and explode the bubble
        if (this.bounceCount >= this.maxBounces && !this.isSmall) {
          this.explode();
        }
      }
    } else {
      this.position.add(this.velocity); // Continue moving if greyed out
      this.velocity.y += 0.6; // Accelerate downwards
    }

    // Bounce at left and right edges of the canvas
    if (this.position.x + this.radius > width || this.position.x - this.radius < 0) {
      this.velocity.x = -this.velocity.x; // Reverse horizontal direction
      this.position.x = constrain(this.position.x, this.radius, width - this.radius); // Constrain within bounds
    }
  }

  // Method to display the bubble
  display() {
    noStroke(); // No outline for the bubble
    if (this.greyOut) {
      fill(100); // Grey color if greyed out
    } else {
      fill(this.color); // Original color otherwise
    }
    ellipse(this.position.x, this.position.y, this.radius * 2); // Draw the bubble as an ellipse
  }

  // Method to handle the explosion of the bubble
  explode() {
    if (this.radius > 10) {
      // Explode only if the bubble is large enough
      for (let i = 0; i < 5; i++) {
        // Create smaller bubbles as a result of the explosion
        let smallBubble = new Bubble(this.position.x, this.position.y, this.radius * 0.4);
        smallBubble.velocity = p5.Vector.random2D().mult(3);
        bubbles.push(smallBubble);
      }
    }
    this.lifespan = -1; // Set lifespan to -1 to remove the bubble
  }

  // Method to change the size of the bubble based on microphone input
  changeSize(vol) {
    this.radius = this.radius * map(vol, 0, 0.5, 1, 1.2); // Scale the radius based on volume
  }

  // Method to determine if the bubble is done (for removal)
  done() {
    if (greyOut && this.position.y - this.radius > height) {
      return true; // If greyed out and off screen, it's done
    }
    return this.lifespan < 0; // Otherwise, check if lifespan is depleted
  }
}

// Method to align bubbles in a sin wave pattern
function alignBubblesInSinWave() {
  offSet += 0.1; // Increment offset for the sin wave
  for (let bubble of bubbles) {
    // Map mouse position to control wave frequency
    let a = map(mouseX, 0, width, 0.05, 0.15, true);
    // Calculate vertical position based on sin wave
    let y = height / 2 + (sin(bubble.position.x * a + offSet + mouseX / 10) * height) / 4;
    bubble.position = createVector(bubble.position.x, y); // Set new position
    bubble.display(); // Display the bubble
  }
}

// Repeller class for creating repelling objects
class Repeller {
  constructor(x, y) {
    this.position = createVector(x, y); // Position vector of the repeller
    this.power = 0.04; // Repelling power
    this.isCircle = random([true, false]); // Randomly decide if it's a circle or rectangle
    this.r = random(5, 20); // Radius for circles
    this.w = random(10, 40); // Width for rectangles
    this.h = random(10, 40); // Height for rectangles
  }

  // Method to display the repeller
  show() {
    stroke(0); // Black outline
    strokeWeight(2); // Outline thickness
    fill(127); // Grey fill
    if (this.isCircle) {
      circle(this.position.x, this.position.y, this.r * 2); // Draw circle if it's a circle
    } else {
      rectMode(CENTER); // Set rectangle mode to center
      rect(this.position.x, this.position.y, this.w, this.h); // Draw rectangle if it's a rectangle
    }
  }

  // Method to repel particles (bubbles)
  repel(particle) {
    let force = p5.Vector.sub(this.position, particle.position); // Calculate force vector
    let distance = force.mag(); // Compute distance
    let strength = 0; // Initialize strength
    if (this.isCircle) {
      // Repelling logic for circles
      if (distance <= this.r + particle.radius) {
        strength = -1 * this.power; // Set strength if close enough
        particle.velocity = force.copy().setMag(-particle.velocity.mag()); // Invert velocity
        particle.explode(); // Trigger explosion
      }
    } else {
      // Repelling logic for rectangles
      if (abs(force.x) <= this.w / 2 + particle.radius && abs(force.y) <= this.h / 2 + particle.radius) {
        particle.velocity = force.copy().setMag(-particle.velocity.mag()); // Invert velocity
        particle.explode(); // Trigger explosion
      }
    }
    force.setMag(strength); // Set magnitude of force
  }
}
// Particle class extending VerletParticle2D for physics simulation
class Particle extends VerletParticle2D {
  constructor(x, y, r) {
    super(x, y); // Call constructor of VerletParticle2D
    this.r = r; // Radius of the particle
    this.color = color(random(255), random(100, 255), 100); // Random color for the particle
  }

  // Method to display the particle
  show() {
    fill(this.color); // Fill with its color
    noStroke(); // No outline
    circle(this.x, this.y, this.r * 2); // Draw the particle
  }
}
