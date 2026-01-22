/**
 * Live Inspector Module
 *
 * A live-updating, collapsible inspector panel for tracking creatures.
 * Designed to be readable for non-programmers while still providing
 * useful debugging information.
 */

import { getSpeciesLabel } from '../sim/species.js';
import { FOOD_LABELS } from '../sim/creatures/food.js';

/**
 * Creates a live inspector panel that tracks a selected creature.
 * @param {Object} options
 * @param {HTMLElement} options.container - Parent element
 * @param {number} options.ticksPerSecond - For converting ticks to seconds
 * @returns {Object} Inspector API
 */
export function createLiveInspector({ container, ticksPerSecond = 60 }) {
  // State
  let trackedCreatureId = null;
  let lastTapLocation = null;
  let sectionStates = {
    status: true,
    needs: true,
    behavior: false,
    body: false,
    hunting: false,
    memory: false,
    genetics: false
  };

  // Create main panel
  const panel = document.createElement('section');
  panel.style.border = '1px solid #333';
  panel.style.borderRadius = '12px';
  panel.style.marginBottom = '12px';
  panel.style.background = '#fff';
  panel.style.fontSize = '14px';

  // Header
  const header = document.createElement('div');
  header.style.padding = '12px';
  header.style.borderBottom = '1px solid #eee';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const title = document.createElement('h2');
  title.textContent = '🔍 Inspector';
  title.style.margin = '0';
  title.style.fontSize = '16px';

  const clearButton = document.createElement('button');
  clearButton.textContent = '✕ Clear';
  clearButton.style.padding = '4px 8px';
  clearButton.style.border = '1px solid #ccc';
  clearButton.style.borderRadius = '4px';
  clearButton.style.background = '#f5f5f5';
  clearButton.style.cursor = 'pointer';
  clearButton.style.fontSize = '12px';
  clearButton.style.display = 'none';

  header.append(title, clearButton);

  // Content area
  const content = document.createElement('div');
  content.style.padding = '12px';

  // Placeholder message
  const placeholder = document.createElement('p');
  placeholder.textContent = 'Tap on a creature to track it. The display will update live as the simulation runs.';
  placeholder.style.color = '#666';
  placeholder.style.margin = '0';
  placeholder.style.fontStyle = 'italic';

  content.append(placeholder);
  panel.append(header, content);
  container.append(panel);

  // Helper: format percentage
  const pct = (value, decimals = 0) => {
    if (!Number.isFinite(value)) return '--';
    return `${(value * 100).toFixed(decimals)}%`;
  };

  // Helper: format number
  const num = (value, decimals = 1) => {
    if (!Number.isFinite(value)) return '--';
    return value.toFixed(decimals);
  };

  // Helper: format ticks as time
  const ticksToTime = (ticks) => {
    if (!Number.isFinite(ticks)) return '--';
    const seconds = ticks / ticksPerSecond;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Helper: create collapsible section
  const createSection = (id, titleText, defaultOpen = false) => {
    const section = document.createElement('div');
    section.style.marginBottom = '8px';
    section.style.border = '1px solid #e0e0e0';
    section.style.borderRadius = '8px';
    section.style.overflow = 'hidden';

    const sectionHeader = document.createElement('div');
    sectionHeader.style.padding = '8px 12px';
    sectionHeader.style.background = '#f8f8f8';
    sectionHeader.style.cursor = 'pointer';
    sectionHeader.style.display = 'flex';
    sectionHeader.style.justifyContent = 'space-between';
    sectionHeader.style.alignItems = 'center';
    sectionHeader.style.userSelect = 'none';

    const sectionTitle = document.createElement('span');
    sectionTitle.textContent = titleText;
    sectionTitle.style.fontWeight = 'bold';
    sectionTitle.style.fontSize = '13px';

    const arrow = document.createElement('span');
    arrow.textContent = sectionStates[id] ? '▼' : '▶';
    arrow.style.fontSize = '10px';
    arrow.style.color = '#666';

    sectionHeader.append(sectionTitle, arrow);

    const sectionBody = document.createElement('div');
    sectionBody.style.padding = '8px 12px';
    sectionBody.style.display = sectionStates[id] ? 'block' : 'none';
    sectionBody.style.fontSize = '13px';
    sectionBody.style.lineHeight = '1.6';

    sectionHeader.addEventListener('click', () => {
      sectionStates[id] = !sectionStates[id];
      sectionBody.style.display = sectionStates[id] ? 'block' : 'none';
      arrow.textContent = sectionStates[id] ? '▼' : '▶';
    });

    section.append(sectionHeader, sectionBody);
    return { section, body: sectionBody };
  };

  // Helper: create a row with label and value
  const row = (label, value, color = null) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.padding = '2px 0';
    
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.color = '#555';
    
    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    valueSpan.style.fontWeight = '500';
    if (color) valueSpan.style.color = color;
    
    div.append(labelSpan, valueSpan);
    return div;
  };

  // Helper: create a meter bar
  const meterBar = (label, value, max = 1, color = '#4CAF50') => {
    const container = document.createElement('div');
    container.style.marginBottom = '6px';

    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.marginBottom = '2px';
    labelRow.style.fontSize = '12px';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.color = '#555';

    const valueSpan = document.createElement('span');
    const percentage = Number.isFinite(value) ? (value / max * 100) : 0;
    valueSpan.textContent = `${percentage.toFixed(0)}%`;
    valueSpan.style.fontWeight = '500';

    labelRow.append(labelSpan, valueSpan);

    const barOuter = document.createElement('div');
    barOuter.style.height = '8px';
    barOuter.style.background = '#e0e0e0';
    barOuter.style.borderRadius = '4px';
    barOuter.style.overflow = 'hidden';

    const barInner = document.createElement('div');
    barInner.style.height = '100%';
    barInner.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    barInner.style.background = color;
    barInner.style.borderRadius = '4px';
    barInner.style.transition = 'width 0.2s';

    barOuter.append(barInner);
    container.append(labelRow, barOuter);
    return container;
  };

  // Build the inspector content for a creature
  const buildCreatureDisplay = (creature, tick) => {
    content.innerHTML = '';

    if (!creature) {
      const lost = document.createElement('p');
      lost.innerHTML = `<strong>Creature lost!</strong><br>The tracked creature may have died or moved out of range.`;
      lost.style.color = '#c62828';
      lost.style.margin = '0';
      content.append(lost);
      return;
    }

    // === STATUS SECTION (always open) ===
    const { section: statusSection, body: statusBody } = createSection('status', '📋 Status', true);
    
    const species = getSpeciesLabel(creature.species) || 'Unknown';
    const speciesEmoji = {
      'Squares': '🟦',
      'Triangles': '🔺',
      'Circles': '🟢',
      'Octagons': '🛑'
    }[species] || '❓';

    statusBody.append(
      row('Creature ID', `#${creature.id}`),
      row('Species', `${speciesEmoji} ${species}`),
      row('Life Stage', creature.lifeStage?.label ?? 'Unknown'),
      row('Age', ticksToTime(creature.ageTicks)),
      row('Position', `${num(creature.position?.x)}, ${num(creature.position?.y)}`)
    );

    // Current activity
    const priority = creature.priority ?? 'unknown';
    const intent = creature.intent?.type ?? 'unknown';
    const priorityLabels = {
      'hunger': '🍽️ Looking for food',
      'thirst': '💧 Looking for water',
      'flee': '🏃 Running away!',
      'mate': '💕 Looking for a mate',
      'rest': '😴 Resting'
    };
    const intentLabels = {
      'eat': '🍽️ Eating',
      'drink': '💧 Drinking',
      'wander': '🚶 Wandering',
      'seek_food': '🔍 Searching for food',
      'seek_water': '🔍 Searching for water',
      'seek_mate': '💕 Seeking a mate',
      'flee': '🏃 Fleeing!',
      'chase': '🎯 Chasing prey'
    };

    const activityDiv = document.createElement('div');
    activityDiv.style.marginTop = '8px';
    activityDiv.style.padding = '8px';
    activityDiv.style.background = '#f0f7ff';
    activityDiv.style.borderRadius = '6px';
    activityDiv.style.textAlign = 'center';
    
    const currentActivity = intentLabels[intent] || priorityLabels[priority] || `${priority} / ${intent}`;
    activityDiv.innerHTML = `<strong>Currently:</strong> ${currentActivity}`;
    statusBody.append(activityDiv);

    content.append(statusSection);

    // === NEEDS SECTION ===
    const { section: needsSection, body: needsBody } = createSection('needs', '❤️ Needs & Health', true);
    
    const meters = creature.meters || {};
    needsBody.append(
      meterBar('Energy (hunger)', meters.energy, 1, '#FF9800'),
      meterBar('Water (thirst)', meters.water, 1, '#2196F3'),
      meterBar('Stamina', meters.stamina, 1, '#9C27B0'),
      meterBar('Health', meters.hp, 1, '#F44336')
    );

    // Pregnancy status
    if (creature.pregnancy?.active) {
      const pregDiv = document.createElement('div');
      pregDiv.style.marginTop = '8px';
      pregDiv.style.padding = '6px';
      pregDiv.style.background = '#fff3e0';
      pregDiv.style.borderRadius = '4px';
      pregDiv.style.fontSize = '12px';
      
      const remaining = creature.pregnancy.gestationTicksRemaining || 0;
      const total = creature.pregnancy.gestationTicksTotal || 1;
      const progress = ((total - remaining) / total * 100).toFixed(0);
      pregDiv.innerHTML = `🤰 <strong>Pregnant!</strong> ${progress}% (${ticksToTime(remaining)} remaining)`;
      needsBody.append(pregDiv);
    }

    content.append(needsSection);

    // === BEHAVIOR SECTION ===
    const { section: behaviorSection, body: behaviorBody } = createSection('behavior', '🧠 Behavior', false);

    // What they can see
    const perception = creature.perception || {};
    const canSeeFood = perception.foodType && perception.foodDistance;
    const canSeeWater = Number.isFinite(perception.waterDistance);
    
    let seesText = 'Nothing nearby';
    if (canSeeFood && canSeeWater) {
      seesText = `${FOOD_LABELS[perception.foodType] || 'Food'} (${num(perception.foodDistance)} tiles) and Water (${num(perception.waterDistance)} tiles)`;
    } else if (canSeeFood) {
      seesText = `${FOOD_LABELS[perception.foodType] || 'Food'} (${num(perception.foodDistance)} tiles away)`;
    } else if (canSeeWater) {
      seesText = `Water (${num(perception.waterDistance)} tiles away)`;
    }

    behaviorBody.append(
      row('Can see', seesText),
      row('Vision range', `${num(perception.range || creature.traits?.perceptionRange)} tiles`),
      row('Alertness', pct(creature.alertness?.level)),
      row('Sprinting', creature.sprinting ? '🏃 Yes' : 'No')
    );

    // Food preference
    if (creature.intent?.foodType) {
      behaviorBody.append(row('Seeking', FOOD_LABELS[creature.intent.foodType] || creature.intent.foodType));
    }

    content.append(behaviorSection);

    // === BODY SECTION ===
    const { section: bodySection, body: bodyBody } = createSection('body', '🦵 Physical Traits', false);

    const traits = creature.traits || {};
    bodyBody.append(
      row('Movement speed', `${num(traits.speed)} tiles/sec`),
      row('Sprint speed', `${num(traits.speed * (traits.sprintSpeedMultiplier || 1.6))} tiles/sec`),
      row('Energy burn rate', `${num(traits.basalEnergyDrain * 100, 2)}%/sec`),
      row('Water burn rate', `${num(traits.basalWaterDrain * 100, 2)}%/sec`)
    );

    // Life stage effects
    const lifeStage = creature.lifeStage || {};
    if (lifeStage.movementScale !== 1 || lifeStage.metabolismScale !== 1) {
      const effectsDiv = document.createElement('div');
      effectsDiv.style.marginTop = '6px';
      effectsDiv.style.fontSize = '12px';
      effectsDiv.style.color = '#666';
      
      let effects = [];
      if (lifeStage.movementScale < 1) effects.push(`${((1 - lifeStage.movementScale) * 100).toFixed(0)}% slower`);
      if (lifeStage.movementScale > 1) effects.push(`${((lifeStage.movementScale - 1) * 100).toFixed(0)}% faster`);
      if (lifeStage.metabolismScale < 1) effects.push(`${((1 - lifeStage.metabolismScale) * 100).toFixed(0)}% less hungry`);
      if (lifeStage.metabolismScale > 1) effects.push(`${((lifeStage.metabolismScale - 1) * 100).toFixed(0)}% hungrier`);
      
      effectsDiv.textContent = `${lifeStage.label} effects: ${effects.join(', ')}`;
      bodyBody.append(effectsDiv);
    }

    content.append(bodySection);

    // === HUNTING SECTION (for predators) ===
    const chase = creature.chase;
    const targeting = creature.targeting;
    const isHunting = chase?.status === 'pursuing' || chase?.status === 'losing' || targeting?.targetId;

    if (isHunting || chase?.lastOutcome) {
      const { section: huntSection, body: huntBody } = createSection('hunting', '🎯 Hunting', false);

      if (chase?.status && chase.status !== 'idle') {
        const statusLabels = {
          'pursuing': '🏃 Actively chasing',
          'losing': '👀 Losing sight...',
          'resting': '😮‍💨 Catching breath'
        };
        huntBody.append(
          row('Status', statusLabels[chase.status] || chase.status),
          row('Target', `#${chase.targetId || '--'} (${getSpeciesLabel(chase.preySpecies) || 'Unknown'})`),
          row('Distance', `${num(chase.distance)} tiles`)
        );
      }

      if (chase?.lastOutcome) {
        const outcomeLabels = {
          'caught': '✅ Caught prey',
          'lost': '❌ Lost them',
          'exhausted': '😓 Too tired'
        };
        huntBody.append(row('Last hunt', outcomeLabels[chase.lastOutcome] || chase.lastOutcome));
      }

      content.append(huntSection);
    }

    // === MEMORY SECTION ===
    const memories = creature.memory?.entries;
    if (Array.isArray(memories) && memories.length > 0) {
      const { section: memSection, body: memBody } = createSection('memory', '🧠 Memory', false);

      const sorted = [...memories].sort((a, b) => (b?.strength ?? 0) - (a?.strength ?? 0)).slice(0, 5);
      
      for (const mem of sorted) {
        const typeLabels = {
          'food': `🍽️ ${FOOD_LABELS[mem.foodType] || 'Food'}`,
          'water': '💧 Water',
          'danger': '⚠️ Danger',
          'mate': '💕 Mate'
        };
        const label = typeLabels[mem.type] || mem.type;
        const strength = pct(mem.strength);
        const age = ticksToTime(mem.ageTicks);
        
        const memRow = document.createElement('div');
        memRow.style.fontSize = '12px';
        memRow.style.padding = '2px 0';
        memRow.style.borderBottom = '1px solid #f0f0f0';
        memRow.innerHTML = `${label} at (${num(mem.x)}, ${num(mem.y)}) - ${strength} fresh, ${age} ago`;
        memBody.append(memRow);
      }

      content.append(memSection);
    }

    // === GENETICS SECTION ===
    const { section: geneSection, body: geneBody } = createSection('genetics', '🧬 Genetics', false);

    const genome = creature.genome || {};
    const geneLabels = {
      speed: 'Speed gene',
      perceptionRange: 'Vision gene',
      alertness: 'Alertness gene',
      basalEnergyDrain: 'Metabolism gene'
    };

    for (const [key, label] of Object.entries(geneLabels)) {
      if (Number.isFinite(genome[key])) {
        const value = genome[key];
        const deviation = ((value - 0.5) * 200).toFixed(0);
        const deviationText = deviation > 0 ? `+${deviation}%` : `${deviation}%`;
        const color = deviation > 0 ? '#4CAF50' : deviation < 0 ? '#f44336' : '#666';
        geneBody.append(row(label, deviationText, color));
      }
    }

    // Food efficiency
    const eff = traits.foodEfficiency;
    if (eff) {
      const effDiv = document.createElement('div');
      effDiv.style.marginTop = '6px';
      effDiv.style.fontSize = '12px';
      effDiv.innerHTML = `<strong>Digestion:</strong> Grass ${num(eff.grass)}x, Berries ${num(eff.berries)}x, Meat ${num(eff.meat)}x`;
      geneBody.append(effDiv);
    }

    content.append(geneSection);

    // Tick counter at bottom
    const tickDiv = document.createElement('div');
    tickDiv.style.marginTop = '8px';
    tickDiv.style.fontSize = '11px';
    tickDiv.style.color = '#999';
    tickDiv.style.textAlign = 'right';
    tickDiv.textContent = `Tick: ${tick} | Updated live`;
    content.append(tickDiv);
  };

  // Clear button handler
  clearButton.addEventListener('click', () => {
    trackedCreatureId = null;
    lastTapLocation = null;
    clearButton.style.display = 'none';
    title.textContent = '🔍 Inspector';
    content.innerHTML = '';
    content.append(placeholder);
  });

  return {
    /**
     * Called when user taps to select a creature.
     */
    selectCreature(creature, tapLocation) {
      if (creature) {
        trackedCreatureId = creature.id;
        lastTapLocation = tapLocation;
        clearButton.style.display = 'block';
        title.textContent = `🔍 Tracking #${creature.id}`;
      } else {
        // Tapped but no creature found
        trackedCreatureId = null;
        lastTapLocation = tapLocation;
        clearButton.style.display = 'none';
        title.textContent = '🔍 Inspector';
        content.innerHTML = '';
        
        const noCreature = document.createElement('p');
        noCreature.style.margin = '0';
        noCreature.style.color = '#666';
        noCreature.innerHTML = `No creature at (${num(tapLocation?.x)}, ${num(tapLocation?.y)}).<br>Tap directly on a creature to track it.`;
        content.append(noCreature);
      }
    },

    /**
     * Called every tick/frame to update the display.
     * @param {Object} options
     * @param {Array} options.creatures - Current creatures array
     * @param {number} options.tick - Current tick number
     */
    update({ creatures, tick }) {
      if (trackedCreatureId === null) return;

      // Find the tracked creature
      const creature = creatures?.find(c => c?.id === trackedCreatureId);
      buildCreatureDisplay(creature, tick);

      if (!creature) {
        // Creature died - update title
        title.textContent = `🔍 Lost #${trackedCreatureId}`;
        clearButton.style.display = 'block';
      }
    },

    /**
     * Returns the currently tracked creature ID.
     */
    getTrackedId() {
      return trackedCreatureId;
    },

    /**
     * Sets the ticks per second for time formatting.
     */
    setTicksPerSecond(tps) {
      ticksPerSecond = tps;
    }
  };
}
