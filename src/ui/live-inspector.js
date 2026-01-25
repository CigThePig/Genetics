/**
 * Live Inspector Module - Mobile-First Floating Panel
 *
 * A floating inspector panel for tracking creatures with camera follow support.
 * Optimized for touch interaction and mobile screens.
 */

import { getSpeciesLabel } from '../sim/species.js';
import { FOOD_LABELS } from '../sim/creatures/food.js';

/**
 * Creates a floating live inspector panel that tracks a selected creature.
 * @param {Object} options
 * @param {HTMLElement} options.container - Parent element
 * @param {number} options.ticksPerSecond - For converting ticks to seconds
 * @param {Function} options.onFollowToggle - Callback when follow is toggled
 * @returns {Object} Inspector API
 */
export function createLiveInspector({ container, ticksPerSecond = 60, onFollowToggle }) {
  // State
  let trackedCreatureId = null;
  let isFollowing = false;
  let currentTicksPerSecond = ticksPerSecond;
  const sectionStates = { status: true, vitals: true };

  // Create FAB for inspector
  const fabContainer = document.createElement('div');
  fabContainer.className = 'fab-container fab-container-left';

  const inspectorFab = document.createElement('button');
  inspectorFab.className = 'fab';
  inspectorFab.innerHTML = '🔍';
  inspectorFab.title = 'Inspector';

  fabContainer.append(inspectorFab);
  container.append(fabContainer);

  // Create floating panel
  const panel = document.createElement('div');
  panel.className = 'overlay-panel inspector-panel bottom-left';

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';

  const titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.gap = '8px';

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.innerHTML = '🔍 Inspector';

  const followBtn = document.createElement('button');
  followBtn.className = 'follow-btn';
  followBtn.innerHTML = '📍 Follow';
  followBtn.style.display = 'none';

  titleContainer.append(title);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.innerHTML = '×';

  header.append(titleContainer, followBtn, closeBtn);

  // Content area
  const content = document.createElement('div');
  content.className = 'panel-content inspector-content';

  // Placeholder
  const placeholder = document.createElement('p');
  placeholder.className = 'inspector-empty';
  placeholder.innerHTML = 'Tap a creature on the map to inspect it.<br><br>📍 Tap "Follow" to track its movement.';

  content.append(placeholder);
  panel.append(header, content);
  container.append(panel);

  // Panel visibility
  let panelVisible = false;

  const togglePanel = () => {
    panelVisible = !panelVisible;
    panel.classList.toggle('visible', panelVisible);
    inspectorFab.classList.toggle('active', panelVisible);
  };

  inspectorFab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);

  // Follow button handler
  followBtn.addEventListener('click', () => {
    if (trackedCreatureId !== null) {
      isFollowing = !isFollowing;
      followBtn.classList.toggle('active', isFollowing);
      followBtn.innerHTML = isFollowing ? '📍 Following' : '📍 Follow';
      onFollowToggle?.(trackedCreatureId, isFollowing);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const pct = (value, decimals = 0) => {
    if (!Number.isFinite(value)) return '--';
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const num = (value, decimals = 1) => {
    if (!Number.isFinite(value)) return '--';
    return value.toFixed(decimals);
  };

  const ticksToTime = (ticks) => {
    if (!Number.isFinite(ticks)) return '--';
    const seconds = ticks / currentTicksPerSecond;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE SECTION HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  const createSection = (id, titleText, emoji, defaultOpen = false) => {
    if (typeof sectionStates[id] !== 'boolean') {
      sectionStates[id] = defaultOpen;
    }

    const section = document.createElement('div');
    section.className = 'inspector-section';

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'inspector-section-header';

    const sectionTitle = document.createElement('span');
    sectionTitle.className = 'inspector-section-title';
    sectionTitle.innerHTML = `${emoji} ${titleText}`;

    const arrow = document.createElement('span');
    arrow.className = 'inspector-section-arrow';
    arrow.classList.toggle('expanded', sectionStates[id]);
    arrow.textContent = '▶';

    sectionHeader.append(sectionTitle, arrow);

    const sectionBody = document.createElement('div');
    sectionBody.className = 'inspector-section-body';
    sectionBody.classList.toggle('expanded', sectionStates[id]);

    const sectionContent = document.createElement('div');
    sectionContent.className = 'inspector-section-content';

    sectionBody.append(sectionContent);

    sectionHeader.addEventListener('click', () => {
      sectionStates[id] = !sectionStates[id];
      sectionBody.classList.toggle('expanded', sectionStates[id]);
      arrow.classList.toggle('expanded', sectionStates[id]);
    });

    section.append(sectionHeader, sectionBody);
    return { section, body: sectionContent };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ROW HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const row = (label, value, color = null) => {
    const div = document.createElement('div');
    div.className = 'inspector-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspector-label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'inspector-value';
    valueSpan.textContent = value;
    if (color) valueSpan.style.color = color;

    div.append(labelSpan, valueSpan);
    return div;
  };

  const meterBar = (label, value, max = 1, colorClass = 'energy') => {
    const container = document.createElement('div');
    container.className = 'meter-container';

    const labelRow = document.createElement('div');
    labelRow.className = 'meter-label-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspector-label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    const percentage = Number.isFinite(value) ? (value / max) * 100 : 0;
    valueSpan.textContent = `${percentage.toFixed(0)}%`;
    valueSpan.className = 'inspector-value';

    labelRow.append(labelSpan, valueSpan);

    const bar = document.createElement('div');
    bar.className = 'meter-bar';

    const fill = document.createElement('div');
    fill.className = `meter-fill ${colorClass}`;
    fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;

    bar.append(fill);
    container.append(labelRow, bar);
    return container;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD CREATURE DISPLAY
  // ═══════════════════════════════════════════════════════════════════════════

  const buildCreatureDisplay = (creature, tick) => {
    content.innerHTML = '';

    if (!creature) {
      const lost = document.createElement('div');
      lost.className = 'inspector-empty';
      lost.innerHTML = `<strong style="color: var(--accent-red);">Creature lost!</strong><br>May have died or moved out of range.`;
      content.append(lost);
      followBtn.style.display = 'none';
      return;
    }

    followBtn.style.display = 'block';

    // STATUS SECTION
    const { section: statusSection, body: statusBody } = createSection('status', 'Status', '📋', true);

    const species = getSpeciesLabel(creature.species) || 'Unknown';
    const speciesEmoji = {
      Squares: '🟨',
      Triangles: '🔺',
      Circles: '🔵',
      Octagons: '🟣'
    }[species] || '❓';

    statusBody.append(
      row('Species', `${speciesEmoji} ${species}`),
      row('ID', `#${creature.id}`),
      row('Age', ticksToTime(creature.age)),
      row('Stage', creature.lifeStage?.label || '--'),
      row('Position', `(${num(creature.position?.x, 0)}, ${num(creature.position?.y, 0)})`)
    );

    if (creature.gender) {
      statusBody.append(row('Gender', creature.gender === 'male' ? '♂ Male' : '♀ Female'));
    }

    if (creature.pregnancy?.active) {
      statusBody.append(
        row('Pregnant', '🤰 Yes'),
        row('Due in', ticksToTime(creature.pregnancy.gestationRemaining))
      );
    }

    content.append(statusSection);

    // VITALS SECTION
    const { section: vitalsSection, body: vitalsBody } = createSection('vitals', 'Vitals', '❤️', true);

    vitalsBody.append(
      meterBar('Energy', creature.energy, 1, 'energy'),
      meterBar('Water', creature.water, 1, 'water'),
      meterBar('Health', creature.health, 1, 'health'),
      meterBar('Stamina', creature.stamina, 1, 'stamina')
    );

    content.append(vitalsSection);

    // BEHAVIOR SECTION
    const { section: behaviorSection, body: behaviorBody } = createSection('behavior', 'Behavior', '🧠', false);

    const intent = creature.intent?.action || 'idle';
    const intentLabels = {
      idle: '😴 Idle',
      wander: '🚶 Wandering',
      flee: '🏃 Fleeing!',
      seekFood: '🍽️ Seeking food',
      seekWater: '💧 Seeking water',
      seekMate: '💕 Seeking mate',
      hunt: '🎯 Hunting',
      graze: '🌿 Grazing',
      drink: '💧 Drinking',
      eat: '🍖 Eating',
      rest: '😌 Resting'
    };

    behaviorBody.append(
      row('Action', intentLabels[intent] || intent),
      row('Alertness', pct(creature.alertness?.level))
    );

    if (creature.intent?.foodType) {
      behaviorBody.append(row('Seeking', FOOD_LABELS[creature.intent.foodType] || creature.intent.foodType));
    }

    if (creature.targeting?.targetId) {
      behaviorBody.append(row('Target', `#${creature.targeting.targetId}`));
    }

    content.append(behaviorSection);

    // TRAITS SECTION
    const { section: traitsSection, body: traitsBody } = createSection('traits', 'Traits', '🦵', false);

    const traits = creature.traits || {};
    traitsBody.append(
      row('Speed', `${num(traits.speed)} tiles/s`),
      row('Sprint', `${num(traits.speed * (traits.sprintSpeedMultiplier || 1.6))} tiles/s`),
      row('Vision', `${num(traits.perceptionRange)} tiles`),
      row('Energy burn', `${num(traits.basalEnergyDrain * 100, 2)}%/s`),
      row('Water burn', `${num(traits.basalWaterDrain * 100, 2)}%/s`)
    );

    content.append(traitsSection);

    // HUNTING SECTION (predators only)
    const chase = creature.chase;
    if (chase?.status && chase.status !== 'idle') {
      const { section: huntSection, body: huntBody } = createSection('hunting', 'Hunting', '🎯', false);

      const chaseLabels = {
        pursuing: '🏃 Pursuing',
        losing: '👀 Losing sight',
        resting: '😮‍💨 Resting'
      };

      huntBody.append(
        row('Status', chaseLabels[chase.status] || chase.status),
        row('Target', `#${chase.targetId || '--'}`),
        row('Distance', `${num(chase.distance)} tiles`)
      );

      if (chase.lastOutcome) {
        const outcomeLabels = {
          caught: '✅ Caught',
          lost: '❌ Lost',
          exhausted: '😓 Exhausted'
        };
        huntBody.append(row('Last hunt', outcomeLabels[chase.lastOutcome] || chase.lastOutcome));
      }

      content.append(huntSection);
    }

    // GENETICS SECTION
    const { section: geneSection, body: geneBody } = createSection('genetics', 'Genetics', '🧬', false);

    const genome = creature.genome || {};
    const geneLabels = {
      speed: 'Speed gene',
      perceptionRange: 'Vision gene',
      alertness: 'Alertness gene',
      basalEnergyDrain: 'Metabolism'
    };

    for (const [key, label] of Object.entries(geneLabels)) {
      if (Number.isFinite(genome[key])) {
        const deviation = ((genome[key] - 0.5) * 200).toFixed(0);
        const deviationText = deviation > 0 ? `+${deviation}%` : `${deviation}%`;
        const color = deviation > 0 ? '#4ade80' : deviation < 0 ? '#f87171' : null;
        geneBody.append(row(label, deviationText, color));
      }
    }

    content.append(geneSection);

    // Tick footer
    const tickDiv = document.createElement('div');
    tickDiv.style.marginTop = '12px';
    tickDiv.style.fontSize = '11px';
    tickDiv.style.color = 'var(--text-muted)';
    tickDiv.style.textAlign = 'right';
    tickDiv.textContent = `Tick: ${tick} • Live`;
    content.append(tickDiv);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    /**
     * Called when user taps to select a creature.
     */
    selectCreature(creature, tapLocation) {
      if (creature) {
        trackedCreatureId = creature.id;
        isFollowing = false;
        followBtn.classList.remove('active');
        followBtn.innerHTML = '📍 Follow';
        title.textContent = `🔍 #${creature.id}`;
        
        // Auto-open panel when selecting a creature
        if (!panelVisible) {
          togglePanel();
        }
      } else {
        trackedCreatureId = null;
        isFollowing = false;
        followBtn.classList.remove('active');
        followBtn.innerHTML = '📍 Follow';
        followBtn.style.display = 'none';
        title.textContent = '🔍 Inspector';
        content.innerHTML = '';

        const noCreature = document.createElement('p');
        noCreature.className = 'inspector-empty';
        noCreature.innerHTML = `No creature at (${num(tapLocation?.x, 0)}, ${num(tapLocation?.y, 0)}).<br>Tap directly on a creature.`;
        content.append(noCreature);
      }
    },

    /**
     * Called every tick/frame to update the display.
     */
    update({ creatures, tick }) {
      if (trackedCreatureId === null) return;

      const creature = creatures?.find(c => c?.id === trackedCreatureId);
      buildCreatureDisplay(creature, tick);

      if (!creature) {
        title.textContent = `🔍 Lost #${trackedCreatureId}`;
        isFollowing = false;
        followBtn.classList.remove('active');
        onFollowToggle?.(null, false);
      }
    },

    /**
     * Returns the currently tracked creature ID.
     */
    getTrackedId() {
      return trackedCreatureId;
    },

    /**
     * Check if currently following.
     */
    isFollowing() {
      return isFollowing && trackedCreatureId !== null;
    },

    /**
     * Sets the ticks per second for time formatting.
     */
    setTicksPerSecond(tps) {
      currentTicksPerSecond = Number.isFinite(tps) && tps > 0 ? tps : 60;
    },

    /**
     * Open or close the panel programmatically.
     */
    setVisible(visible) {
      if (visible !== panelVisible) {
        togglePanel();
      }
    },

    /**
     * Clear tracking.
     */
    clear() {
      trackedCreatureId = null;
      isFollowing = false;
      followBtn.classList.remove('active');
      followBtn.innerHTML = '📍 Follow';
      followBtn.style.display = 'none';
      title.textContent = '🔍 Inspector';
      content.innerHTML = '';
      content.append(placeholder.cloneNode(true));
      onFollowToggle?.(null, false);
    }
  };
}
