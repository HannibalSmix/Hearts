<?php

declare(strict_types=1);

namespace Bga\Games\HeartsHannibalSmix\States;

use Bga\GameFramework\StateType;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\HeartsHannibalSmix\Game;

class PlayerTurn extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 31,
            type: StateType::ACTIVE_PLAYER, // This state type means that one player is active and can do actions
            description: clienttranslate('${actplayer} must play a card'), // We tell OTHER players what they are waiting for
            descriptionMyTurn: clienttranslate('${you} must play a card'), // We tell the ACTIVE player what they must do
            // We suround the code with clienttranslate() so that the text is sent to the client for translation (this will enable the game to support other languages)
        );
    }

    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `PlayerTurn` game state.
     */
    public function getArgs(): array
    {
        // Get some values from the current game situation from the database.

        return [
            "playableCardsIds" => [1, 2],
        ];
    }    

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws UserException
     */
    #[PossibleAction] // a PHP attribute that tells BGA "this method describes a possible action that the player could take", so that you can call that action from the front (the client)
    public function actPlayCard(int $cardId, int $activePlayerId)
    {
        $game = $this->game;
        $game->cards->moveCard($cardId, 'cardsontable', $activePlayerId);
        // TODO: check rules here
        $currentCard = $game->cards->getCard($cardId);
        // And notify
            $game->notify->all('playCard', clienttranslate('${player_name} plays ${value_displayed} ${color_displayed}'), [
                'i18n' => array('color_displayed', 'value_displayed'),
                'card' => $currentCard,
                'player_id' => $activePlayerId,
                'player_name' => $game->getPlayerNameById($activePlayerId),
                'value_displayed' => $game->card_types['types'][$currentCard['type_arg']]['name'],
                'color_displayed' => $game->card_types['suites'][$currentCard['type']]['name']
            ]
            );
        return NextPlayer::class; // after the action, we move to the next player
    }

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player pass, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     */
    #[PossibleAction]
    public function actPass(int $activePlayerId)
    {
        // Notify all players about the choice to pass.
        $this->notify->all("pass", clienttranslate('${player_name} passes'), [
            "player_id" => $activePlayerId,
            "player_name" => $this->game->getPlayerNameById($activePlayerId), // remove this line if you uncomment notification decorator
        ]);

        // in this example, the player gains 1 energy each time he passes
        $this->game->playerEnergy->inc($activePlayerId, 1);

        // at the end of the action, move to the next state
        return NextPlayer::class;
    }

    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: play a random card).
     * 
     * See more about Zombie Mode: https://en.doc.boardgamearena.com/Zombie_Mode
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, 
     * but use the $playerId passed in parameter and $this->game->getPlayerNameById($playerId) instead.
     */
    public function zombie(int $playerId)
    {
        // We must implement this so BGA can auto play in the case a player becomes a zombie, but for this tutorial we won't handle this case
        throw new \BgaUserException('Not implemented: zombie for player ${player_id}', args: [
            'player_id' => $playerId,
        ]);
    }
}