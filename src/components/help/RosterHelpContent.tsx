export default function RosterHelpContent() {
  return (
    <div className="space-y-2">
      <div>
        <h6 className="text-main">Adding &amp; Editing Operatives</h6>
        <p>
          Use the <strong>"Add Operative"</strong> card to add Operatives to your Roster.
          Use an Operative's menu (⋮) to Edit, Delete, Reserve/Deploy, or reorder it.
          Tap an Operative's name to collapse or expand its card.
        </p>
      </div>

      <div>
        <h6 className="text-main">Weapons, Abilities, and Options</h6>
        <p>
          Tap any weapon rule, ability, or option to view its full description.
        </p>
      </div>

      <div>
        <h6 className="text-main">Wounds</h6>
        <p>
          Tap the Operative's <code>W</code> stat to change its current wounds.
          An Operative below half its wounds is marked as injured, and an Operative reduced to <code>0 W</code> is <strong>incapacitated</strong>.
        </p>
      </div>

      <div>
        <h6 className="text-main">Orders &amp; Activation</h6>
        <p>
          Tap an Operative's <strong>order icon</strong> to set it to <strong>Conceal</strong> or <strong>Engage</strong>, and to mark it Ready or Activated.
          Advancing the Turn counter resets all Operative activations automatically.
        </p>
      </div>

      <div>
        <h6 className="text-main">TURN/VP/CP</h6>
        <p>
          Use the tracker bar at the top to manage the current <strong>Turn, Victory Points (VP), and Command Points (CP)</strong>.
        </p>
      </div>

      <div>
        <h6 className="text-main">Resetting Between Games</h6>
        <p>
          Use the <strong>↺</strong> button to set the Turn back to 1, set VP and CP to zero, and reset all Operatives' wounds and activations.
        </p>
      </div>

      <div>
        <h6 className="text-main">Composition &amp; Deployment</h6>
        <p>
          The <strong>Composition</strong> button shows your Kill Team's selection rules.
          Use <strong>Deploy/Reserve</strong> to choose which Operatives are on the board for this game.
        </p>
      </div>

      <div>
        <h6 className="text-main">Tabs</h6>
        <p>
          <strong>Equip</strong> and <strong>Ploys</strong> track what you've selected for the game,
          {' '}<strong>Ops</strong> sets up your Crit Op, Tac Op, and Primary Op,
          and <strong>Opponent</strong> lets you load your opponent's Roster for reference.
        </p>
      </div>

      <div>
        <h6 className="text-main">Roster Name, Portrait, and Description</h6>
        <p>
          Tap the Roster's name to edit its name and description, or set its portrait.
        </p>
      </div>

      <p className="text-muted text-xs">
        You can view this help dialog at any time in the Roster menu (⋮ → Help).
      </p>
    </div>
  )
}
