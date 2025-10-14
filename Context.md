# Context for Word Battle

## Lens Description

This lens is a word battle game. Players take turns choosing their "warriors" and then those matchups are sent to ChatGPT to decide a winner. There are 3 rounds (this should be configurable, not hardcoded).

### Game Flow

Turns are marked by each player sending a Snap to the other.

#### Turn 1

The game starts with player A choosing their "warrior" which can be an object, idea, concept, etc. Think cheese, or T-rex, or the concept of time. They will send a Snap to player B.

#### Turn 2

When player B starts their turn, they will be able to choose their "warrior" in like fashion. The matchup will then be sent to ChatGPT (we are using a built-in remote service module for that integration, don't try setting that up). ChatGPT will respond with the results of the matchup and some sort of animation will play.

If player B wins, they will be able to keep or edit their warrior. Then they'll send the Snap back to player A.

If player B loses, they will need to choose a new warrior.

#### Turn 3

Player A will now see the results of the matchup and view the animation (this isn't a file being sent, it will be triggered in the lens).

If player A won, they will have the chance to keep or change their warrior.

If player A lost, they will need to choose a new warrior.

ChatGPT will again choose a winner and the animation will play and display the results. Then the process resumes.

#### End game

The game ends after 3 matchups have occurred. The player who scored the most points is declared the winner. After whomever wins, they should be prompted to also send a Snap so that the other player can view the final match and see the results.

## Implementation details

This lens is being developed by a team. Each component should be kept as modular as possible. For example, the ChatGPT integration should be developed in isolation and expose a function that can be called by the main game logic. If any functions that need to be called are unknown, please put placeholders in the code.

The main game flow should be implemented in MainController.js. We are building in Lens Studio 5 which has a particular SDK. Please reference other files in the project to get an idea of the syntax to use.

Keep the code simple, concise, and readable (prioritize readability above all else).

## Docs

### Turn based guide

https://developers.snap.com/lens-studio/features/games/turn-based

### Turn based player info guide

https://developers.snap.com/lens-studio/features/games/turn-based-player-info
