// scheduling.js

class HybridScheduler {
  constructor(processes, options = {}) {
    this.processes = processes.map(p => ({ ...p }));
    this.timeQuantum = options.initialQuantum || 2;

    // RL parameters
    this.alpha = 0.1;   // learning rate
    this.gamma = 0.9;   // discount factor
    this.epsilon = 0.2; // exploration rate

    this.qTable = {};   // state-action values
    this.currentTime = 0;
  }

  // State is based on average waiting time bucket
  getState() {
    const avgWaiting =
      this.processes.reduce((acc, p) => acc + (p.waitingTime || 0), 0) /
      this.processes.length;

    if (avgWaiting < 5) return "LOW_WAIT";
    if (avgWaiting < 15) return "MEDIUM_WAIT";
    return "HIGH_WAIT";
  }

  getActions() {
    return ["DECREASE_Q", "KEEP_Q", "INCREASE_Q"];
  }

  chooseAction(state) {
    if (!this.qTable[state]) {
      this.qTable[state] = {};
      this.getActions().forEach(a => (this.qTable[state][a] = 0));
    }

    if (Math.random() < this.epsilon) {
      const actions = this.getActions();
      return actions[Math.floor(Math.random() * actions.length)];
    }

    return Object.keys(this.qTable[state]).reduce((a, b) =>
      this.qTable[state][a] > this.qTable[state][b] ? a : b
    );
  }

  updateQValue(state, action, reward, nextState) {
    const maxNextQ = Math.max(
      ...Object.values(this.qTable[nextState] || { 0: 0 })
    );

    this.qTable[state][action] =
      this.qTable[state][action] +
      this.alpha *
        (reward +
          this.gamma * maxNextQ -
          this.qTable[state][action]);
  }

  adjustQuantum(action) {
    if (action === "DECREASE_Q" && this.timeQuantum > 1)
      this.timeQuantum--;
    if (action === "INCREASE_Q")
      this.timeQuantum++;
  }

  run() {
    const queue = [...this.processes];
    const completed = [];

    while (queue.length > 0) {
      const state = this.getState();
      const action = this.chooseAction(state);
      this.adjustQuantum(action);

      const process = queue.shift();

      if (!process.waitingTime) process.waitingTime = 0;

      const executionTime = Math.min(
        this.timeQuantum,
        process.burstTime
      );

      this.currentTime += executionTime;
      process.burstTime -= executionTime;

      // Update waiting times
      queue.forEach(p => {
        p.waitingTime = (p.waitingTime || 0) + executionTime;
      });

      if (process.burstTime > 0) {
        queue.push(process);
      } else {
        process.completionTime = this.currentTime;
        completed.push(process);
      }

      // Reward = negative average waiting time
      const avgWaiting =
        this.processes.reduce(
          (acc, p) => acc + (p.waitingTime || 0),
          0
        ) / this.processes.length;

      const reward = -avgWaiting;
      const nextState = this.getState();

      this.updateQValue(state, action, reward, nextState);
    }

    return {
      completed,
      finalQuantum: this.timeQuantum,
      qTable: this.qTable
    };
  }
}

module.exports = HybridScheduler;