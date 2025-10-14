// @input SceneObject scoreArea
// @input Component.Text thisPlayerScore
// @input Component.Text otherPlayerScore

function disableScoreArea() {
    script.scoreArea.enabled = false;
}

function enableScoreArea() {
    script.scoreArea.enabled = true;
}

function updateScore(thisPlayerScore, otherPlayerScore) {
    script.thisPlayerScore.text = thisPlayerScore.toString();
    script.otherPlayerScore.text = otherPlayerScore.toString();
}

script.disableScoreArea = disableScoreArea;
script.enableScoreArea = enableScoreArea;
script.updateScore = updateScore;
