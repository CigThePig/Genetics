import { camouflageAt } from '../sim/creatures/visibility.js';
import { matePreferenceMismatch } from '../sim/creatures/mate-preference.js';
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
  let currentWorld = null,
    currentConfig = {},
    currentCreatures = [];
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

  const clearBtn = document.createElement('button');
  clearBtn.className = 'inspector-clear-btn';
  clearBtn.innerHTML = '🧹';
  clearBtn.title = 'Clear selection';
  clearBtn.style.display = 'none';

  titleContainer.append(title);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.innerHTML = '×';

  header.append(titleContainer, followBtn, clearBtn, closeBtn);

  // Content area
  const content = document.createElement('div');
  content.className = 'panel-content inspector-content';

  // Placeholder
  const placeholder = document.createElement('p');
  placeholder.className = 'inspector-empty';
  placeholder.innerHTML =
    'Tap a creature on the map to inspect it.<br><br>📍 Tap "Follow" to track its movement.';

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

  const clearTracking = () => {
    trackedCreatureId = null;
    isFollowing = false;
    followBtn.classList.remove('active');
    followBtn.innerHTML = '📍 Follow';
    followBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    title.textContent = '🔍 Inspector';
    content.innerHTML = '';
    content.append(placeholder.cloneNode(true));
    onFollowToggle?.(null, false);
  };

  clearBtn.addEventListener('click', clearTracking);

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
      clearBtn.style.display = 'none';
      return;
    }

    followBtn.style.display = 'block';
    clearBtn.style.display = 'block';

    const traitsColour = creature.traits ?? {};
    const { section: colourSection, body: colourBody } = createSection(
      'colour',
      'Colour & habitat',
      '🎨',
      true
    );
    const swatchRow = (name, css, value) => {
      const r = row(name, value),
        swatch = document.createElement('span');
      swatch.className = 'colour-swatch';
      swatch.style.background = css ?? '#888';
      r.lastElementChild.prepend(swatch);
      return r;
    };
    const camo = camouflageAt(creature, currentWorld, currentConfig);
    const habitat =
      currentWorld?.getTerrainAt(
        Math.floor(creature.position.x),
        Math.floor(creature.position.y)
      ) ?? 'unknown';
    const mate = currentCreatures.find((c) => c.id === creature.reproduction?.mate?.targetId);
    colourBody.append(
      swatchRow(
        'Body',
        traitsColour.bodyCss,
        `${Math.round((traitsColour.bodyHue ?? 0) * 360)}° · S ${pct(traitsColour.bodySaturation)} · L ${pct(traitsColour.bodyLightness)}`
      ),
      swatchRow(
        'Preferred hue',
        traitsColour.preferredMateCss,
        `${Math.round((traitsColour.matePreferenceHue ?? 0) * 360)}°`
      ),
      row('Choosiness', pct(traitsColour.mateChoosiness)),
      row('Discrimination', pct(traitsColour.colourDiscrimination)),
      row('Habitat', habitat),
      row('Background contrast', pct(camo.contrast)),
      row(
        'Colour exposure',
        currentConfig.colourCamouflageEnabled === false ? 'Disabled' : pct(camo.exposure)
      ),
      row('Generation', String(creature.generation ?? 0)),
      row(
        'Mate target',
        mate ? `#${mate.id} · mismatch ${pct(matePreferenceMismatch(creature, mate))}` : 'None'
      )
    );
    const explanation = document.createElement('small');
    explanation.textContent =
      'Exposure estimates colour concealment; actual detection also depends on observer senses, range and movement. Species is identified by shape.';
    colourBody.append(explanation);
    content.append(colourSection);

    // STATUS SECTION
    const { section: statusSection, body: statusBody } = createSection(
      'status',
      'Status',
      '📋',
      true
    );

    const species = getSpeciesLabel(creature.species) || 'Unknown';
    const speciesEmoji =
      {
        Squares: '🟨',
        Triangles: '🔺',
        Circles: '🔵',
        Octagons: '🟣'
      }[species] || '❓';

    statusBody.append(
      row('Species', `${speciesEmoji} ${species}`),
      row('ID', `#${creature.id}`),
      row('Age', ticksToTime(creature.ageTicks)),
      row('Stage', creature.lifeStage?.label || '--'),
      row('Position', `(${num(creature.position?.x, 0)}, ${num(creature.position?.y, 0)})`)
    );

    if (creature.sex) {
      statusBody.append(row('Sex', creature.sex === 'male' ? '♂ Male' : '♀ Female'));
    }

    // Pregnancy status
    const pregnancy = creature.reproduction?.pregnancy;
    if (pregnancy?.isPregnant) {
      const remaining = pregnancy.gestationTicksRemaining ?? 0;
      const total = pregnancy.gestationTicksTotal ?? 1;
      const progress = Math.round(((total - remaining) / Math.max(1, total)) * 100);
      statusBody.append(row('Pregnant', `🤰 ${progress}%`), row('Due in', ticksToTime(remaining)));
    }

    content.append(statusSection);

    // VITALS SECTION
    const { section: vitalsSection, body: vitalsBody } = createSection(
      'vitals',
      'Vitals',
      '❤️',
      true
    );

    const meters = creature.meters || {};
    vitalsBody.append(
      meterBar('Energy', meters.energy, 1, 'energy'),
      meterBar('Water', meters.water, 1, 'water'),
      meterBar('Health', meters.hp, 1, 'health'),
      meterBar('Stamina', meters.stamina, 1, 'stamina')
    );

    content.append(vitalsSection);

    // BEHAVIOR SECTION
    const { section: behaviorSection, body: behaviorBody } = createSection(
      'behavior',
      'Behavior',
      '🧠',
      false
    );

    const priority = creature.priority ?? 'unknown';
    const intentType = creature.intent?.type ?? 'unknown';

    const priorityLabels = {
      hunger: '🍽️ Looking for food',
      thirst: '💧 Looking for water',
      flee: '🏃 Running away!',
      mate: '💕 Looking for a mate',
      rest: '😴 Resting'
    };

    const intentLabels = {
      eat: '🍽️ Eating',
      drink: '💧 Drinking',
      wander: '🚶 Wandering',
      seek_food: '🔍 Searching for food',
      seek_water: '🔍 Searching for water',
      seek_mate: '💕 Seeking a mate',
      mate: '💕 Seeking a mate',
      hunt: '🎯 Hunting prey',
      flee: '🏃 Fleeing!',
      chase: '🎯 Chasing prey',
      idle: '😴 Idle'
    };

    const currentActivity = creature.herding?.isThreatened
      ? '🏃 Escaping observed danger'
      : intentLabels[intentType] || priorityLabels[priority] || `${priority} / ${intentType}`;

    behaviorBody.append(
      row('Activity', currentActivity),
      row('Priority', priority),
      row('Alertness', pct(creature.alertness?.level)),
      row(
        'Escape buffer',
        Number.isFinite(creature.herding?.escapeDistance)
          ? `${creature.herding.escapeDistance.toFixed(1)} tiles`
          : '—'
      ),
      row('Sprinting', creature.sprinting ? '🏃 Yes' : 'No')
    );

    if (intentType === 'drink' || (intentType === 'eat' && creature.intent?.foodType === 'meat')) {
      const threshold =
        intentType === 'drink'
          ? (creature.traits?.drinkThreshold ?? currentConfig.creatureDrinkThreshold ?? 0.8)
          : (creature.traits?.eatThreshold ?? currentConfig.creatureEatThreshold ?? 0.8);
      behaviorBody.append(
        row(
          'Recovery target',
          pct(Math.min(1, Math.max(threshold, currentConfig.creatureResourceRecoveryRatio ?? 0.95)))
        )
      );
      behaviorBody.append(row('Recovery', 'Use available resource; emergency needs can interrupt'));
    }

    if (creature.intent?.foodType) {
      behaviorBody.append(
        row('Seeking', FOOD_LABELS[creature.intent.foodType] || creature.intent.foodType)
      );
    }

    if (creature.targeting?.targetId) {
      behaviorBody.append(row('Target', `#${creature.targeting.targetId}`));
    }

    const goal = creature.locomotion;
    if (
      goal &&
      ['wander', 'graze'].includes(creature.intent?.type) &&
      !creature.herding?.isThreatened
    )
      behaviorBody.append(row('Movement', goal.reason));
    const contacts = creature.reproduction?.contacts?.entries ?? [];
    if (contacts.length)
      behaviorBody.append(row('Remembered mate contacts', String(contacts.length)));
    if (creature.lineage?.birthplace) {
      const birth = creature.lineage.birthplace;
      behaviorBody.append(row('Birthplace', `${birth.x.toFixed(1)}, ${birth.y.toFixed(1)}`));
      behaviorBody.append(
        row(
          'Natal displacement',
          `${Math.hypot(creature.position.x - birth.x, creature.position.y - birth.y).toFixed(1)} tiles`
        )
      );
    }
    const destination = creature.intent?.target;
    if (
      creature.intent?.type === 'seek' &&
      creature.search?.goal === 'mate-contact' &&
      contacts.some((e) => e.position.x === destination?.x && e.position.y === destination?.y)
    )
      behaviorBody.append(row('Mate search', 'Revisiting a last observed contact location'));
    if (destination)
      behaviorBody.append(
        row('Destination', `${destination.x.toFixed(1)}, ${destination.y.toFixed(1)}`)
      );
    const group = creature.pack?.id ?? creature.herding?.groupId;
    if (group) behaviorBody.append(row(creature.pack?.id ? 'Pack' : 'Herd', String(group)));
    if (creature.herding?.isThreatened)
      behaviorBody.append(
        row(
          'Danger',
          creature.herding.nearbyThreats ? 'Visible predator' : 'Remembered / social warning'
        )
      );
    if (creature.pack?.waypoint && creature.intent?.type !== 'hunt')
      behaviorBody.append(
        row(
          'Search',
          `${creature.pack.role}; ${creature.pack.visited?.length ?? 0} recent locations`
        )
      );
    content.append(behaviorSection);

    // TRAITS SECTION
    const { section: traitsSection, body: traitsBody } = createSection(
      'traits',
      'Traits',
      '🦵',
      false
    );

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
      const { section: huntSection, body: huntBody } = createSection(
        'hunting',
        'Hunting',
        '🎯',
        false
      );

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
    const { section: geneSection, body: geneBody } = createSection(
      'genetics',
      'Genetics',
      '🧬',
      false
    );

    const genome = creature.genome || {};
    const genomeKeys = Object.keys(genome)
      .filter(
        (key) =>
          Number.isFinite(genome[key]) &&
          ![
            'bodyHue',
            'bodySaturation',
            'bodyLightness',
            'matePreferenceHue',
            'mateChoosiness',
            'colourDiscrimination'
          ].includes(key)
      )
      .sort();

    // Helper to convert camelCase to readable labels
    const camelToLabel = (str) => {
      return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
    };

    if (genomeKeys.length === 0) {
      geneBody.append(row('Genome', 'No genes'));
    } else {
      for (const key of genomeKeys) {
        const label = camelToLabel(key);
        const deviation = ((genome[key] - 0.5) * 200).toFixed(0);
        const deviationText = deviation > 0 ? `+${deviation}%` : `${deviation}%`;
        const color = deviation > 0 ? '#4ade80' : deviation < 0 ? '#f87171' : null;
        geneBody.append(row(label, deviationText, color));
      }
    }

    content.append(geneSection);

    const behavior = document.createElement('p');
    behavior.textContent = `Behavior: ${creature.behaviorState?.state ?? 'relaxed'} / ${creature.behaviorState?.phase ?? 'none'}`;
    content.append(behavior);

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
        clearBtn.style.display = 'none';
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
    update({ creatures, tick, world, config }) {
      currentWorld = world ?? currentWorld;
      currentConfig = config ?? currentConfig;
      currentCreatures = creatures ?? [];
      if (trackedCreatureId === null) return;

      const creature = creatures?.find((c) => c?.id === trackedCreatureId);
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
      clearTracking();
    }
  };
}
