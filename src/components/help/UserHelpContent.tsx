export default function UserHelpContent() {
  return (
    <div className="space-y-2">
      <div>
        <p>
          Your <strong>Rosters</strong> are listed on this page.
          New accounts start with a Sample Roster to get you going.
        </p>
      </div>

      <div>
        <h6 className="text-main">Adding a Roster</h6>
        <p>
          Use the <strong>"+ New Roster"</strong> button to create a new Roster.
          Select a Kill Team and optionally tick <strong>Import Default Roster</strong> to start from that Kill Team's default setup.
          Tick <strong>Homebrew</strong> to pick from homebrew Kill Teams instead.
        </p>
      </div>

      <div>
        <h6 className="text-main">Viewing a Roster</h6>
        <p>
          Tap any Roster card to open it, including its game trackers (Turn/VP/CP), Operatives, Equipment, Ploys, and Ops.
        </p>
      </div>

      <div>
        <h6 className="text-main">Managing your Rosters</h6>
        <p>
          Use each Roster's menu (⋮) to edit, clone, share, delete, or rearrange your Rosters.
        </p>
      </div>

      <div>
        <h6 className="text-main">Homebrew Kill Teams</h6>
        <p>
          Use the <strong>"+ New Homebrew"</strong> button to design your own Kill Team (up to 50).
          Your homebrew Kill Teams appear under the <strong>Homebrew</strong> tab.
        </p>
      </div>
    </div>
  )
}
