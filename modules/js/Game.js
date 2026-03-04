/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * HeartsHannibalSmix implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.js
 *
 * HeartsHannibalSmix user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

/**
 * We create one State class per declared state on the PHP side, to handle all state specific code here.
 * onEnteringState, onLeavingState and onPlayerActivationChange are predefined names that will be called by the framework.
 * When executing code in this state, you can access the args using this.args
 */

const BgaAnimations = await importEsmLib('bga-animations', '1.x');
const BgaCards = await importEsmLib('bga-cards', '1.x');

class PlayerTurn {
    constructor(game, bga) {
        this.game = game;
        this.bga = bga;
    }

    /**
     * This method is called each time we are entering the game state. You can use this method to perform some user interface changes at this moment.
     */
    onEnteringState(args, isCurrentPlayerActive) {
        this.bga.statusBar.setTitle(isCurrentPlayerActive ? 
            _('${you} must play a card or pass') :
            _('${actplayer} must play a card or pass')
        );
      
        if (isCurrentPlayerActive) {
            //const playableCardsIds = args.playableCardsIds; // returned by the PlayerTurn::getArgs
            //const playableCardIds = args.playableCards.map(id => parseInt(id));
            const playableCardIds = args._private.playableCards.map((x) =>
              parseInt(x)
            ); 
            
            const allCards = this.game.handStock.getCards();

            const playableCards = allCards.filter(
                card => playableCardIds.includes(parseInt(card.id))
            );

            this.game.handStock.setSelectionMode("single", playableCards);
            //this.game.handStock.setSelectableItems(playableCards);
            
            // Add test action buttons in the action status bar, simulating a card click:
            // playableCardsIds.forEach(
            //     cardId => this.bga.statusBar.addActionButton(_('Play card with id ${card_id}').replace('${card_id}', cardId), () => this.onCardClick(cardId))
            // ); 

            this.bga.statusBar.addActionButton(_('Pass'), () => this.bga.actions.performAction("actPass"), { color: 'secondary' }); 
        }
    }

    /**
     * This method is called each time we are leaving the game state. You can use this method to perform some user interface changes at this moment.
     */
    onLeavingState(args, isCurrentPlayerActive) {
    }

    /**
     * This method is called each time the current player becomes active or inactive in a MULTIPLE_ACTIVE_PLAYER state. You can use this method to perform some user interface changes at this moment.
     * on MULTIPLE_ACTIVE_PLAYER states, you may want to call this function in onEnteringState using `this.onPlayerActivationChange(args, isCurrentPlayerActive)` at the end of onEnteringState.
     * If your state is not a MULTIPLE_ACTIVE_PLAYER one, you can delete this function.
     */
    onPlayerActivationChange(args, isCurrentPlayerActive) {
    }

    onUpdateActionButtons(args, stateName) {
      console.log("onUpdateActionButtons: " + stateName, args);

      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
          case "playerTurn":
            break;
        }
      }
    }

    
    
}

export class Game {
    constructor(bga) {
        console.log('heartshannibalsmix constructor');
        this.bga = bga;

        // Declare the State classes
        this.playerTurn = new PlayerTurn(this, bga);
        this.bga.states.register('PlayerTurn', this.playerTurn);

        // Uncomment the next line to show debug informations about state changes in the console. Remove before going to production!
        // this.bga.states.logger = console.log;
            
        // Here, you can init the global variables of your user interface
        // Example:
        // this.myGlobalValue = 0;
    }
    /*
        setup:
        
        This method must set up the game user interface according to current game situation specified
        in parameters.
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
        
        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
       
    onCardClick(card){
        console.log("onCardClick", card);
        if (!card) return; // hmm
        switch (this.gamedatas.gamestate.name) {
            case "PlayerTurn":
                // Can play a card
                this.bga.actions.performAction("actPlayCard", {
                    cardId: card.id, // this corresponds to the argument name in php, so it needs to be exactly the same
                });
                break;
            case "GiveCards":
                // Can give cards TODO
                break;
            default: {
                this.handStock.unselectAll();
                break;
            }
        }       
    }
    
    setup( gamedatas ) {
        console.log( "Starting game setup" );
        this.gamedatas = gamedatas;

        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="myhand_wrap" class="whiteblock">
                <b id="myhand_label">${_('My hand')}</b>
                <div id="myhand">
                    
                </div>
            </div>

        `);

        // Example to add a div on the game area
        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="player-tables"></div>
        `);
        
        // Setting up player boards
        const numPlayers = Object.keys(gamedatas.players).length;
        Object.values(gamedatas.players).forEach((player, index) => {
            document.getElementById("player-tables").insertAdjacentHTML(
            "beforeend",
            // we generate this html snippet for each player
            `
        <div class="playertable whiteblock playertable_${index}">
            <div class="playertablename" style="color:#${player.color};">${player.name}</div>
            <div id="tableau_${player.id}" class="tableau"></div>
            <div id="cardswon_${player.id}" class="cardswon"></div>
        </div>
        `
            );
        });

        // Hide hand zone from spectators
        if (this.isSpectator)
            document.getElementById("myhand_wrap").style.display = "none";

        
        // TODO: Set up your game interface here, according to "gamedatas"
        // create the animation manager, and bind it to the `game.bgaAnimationsActive()` function
        this.animationManager = new BgaAnimations.Manager({
            animationsActive: () => this.bga.gameui.bgaAnimationsActive(),
        });

        const cardWidth = 100;
        const cardHeight = 135;

        // create the card manager
        this.cardsManager = new BgaCards.Manager({
            animationManager: this.animationManager,
            type: "ha-card", // the "type" of our cards in css
            getId: (card) => card.id,

            cardWidth: cardWidth,
            cardHeight: cardHeight,
            cardBorderRadius: "5%",
            setupFrontDiv: (card, div) => {
            div.dataset.type = card.type; // suit 1..4
            div.dataset.typeArg = card.type_arg; // value 2..14
            div.style.backgroundPositionX = `calc(100% / 14 * (${card.type_arg} - 2))`; // 14 is number of columns in stock image minus 1
            div.style.backgroundPositionY = `calc(100% / 3 * (${card.type} - 1))`; // 3 is number of rows in stock image minus 1
            this.bga.gameui.addTooltipHtml(div.id, `tooltip of ${card.type}`);
            },
        });

        // create the stock, in the game setup
        this.handStock = new BgaCards.HandStock(
            this.cardsManager,
            document.getElementById("myhand"),
            {
                sort: BgaCards.sort('type', 'type_arg'), // sort by suite then by value
            }
        );

        //this.handStock.setSelectionMode("single");
        this.handStock.onCardClick = (card) => {
            this.onCardClick(card);
        };

        // TODO: fix handStock
        //this.handStock.addCards(Array.from(Object.values(this.gamedatas.hand)));
        this.handStock.addCards(this.remapToBgaCardList(this.gamedatas.hand));

        // map stocks
        this.tableauStocks = [];
        Object.values(gamedatas.players).forEach((player, index) => {
            // add player tableau stock
            this.tableauStocks[player.id] = new BgaCards.LineStock(
                this.cardsManager,
                document.getElementById(`tableau_${player.id}`)
            );
            // add void stock
            new BgaCards.VoidStock(
                this.cardsManager,
                document.getElementById(`cardswon_${player.id}`),
                {
                autoPlace: (card) =>
                    card.location === "cardswon" && card.location_arg == player.id,
                }
            );
        });

        // Cards played on table
        for (i in this.gamedatas.cardsontable) {
            var card = this.gamedatas.cardsontable[i];
            var player_id = card.location_arg;
            this.tableauStocks[player_id].addCards(this.remapToBgaCardList(card));
        }

        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();

        console.log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Utility methods
    
    /*
    
        Here, you can defines some utility methods that you can use everywhere in your javascript
        script. Typically, functions that are used in multiple state classes or outside a state class.
    
    */
    remapToBgaCardList(cards) {
        if (!cards) return [];
        if (cards.type) {
        // actually one card
            return [this.remapToBgaCard(cards)];
        } else if (Array.isArray(cards)) {
            return cards.map((card) => this.remapToBgaCard(card));
        } else {
            return Object.values(cards).map((card) => this.remapToBgaCard(card));
        }
    }

    remapToBgaCard(card) {
        // proper casts
        return {
            id: parseInt(card.id),
            type: parseInt(card.type),
            type_arg: parseInt(card.type_arg),
            location: card.location,
            location_arg: parseInt(card.location_arg),
        };
    }
    
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:
        
        In this method, you associate each of your game notifications with your local method to handle it.
        
        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your heartshannibalsmix.game.php file.
    
    */
    setupNotifications() {
        console.log( 'notifications subscriptions setup' );
        
        // automatically listen to the notifications, based on the `notif_xxx` function on this class. 
        // Uncomment the logger param to see debug information in the console about notifications.
        this.bga.notifications.setupPromiseNotifications({
            // logger: console.log
        });
    }
    
    // TODO: from this point and below, you can write your game notifications handling methods
    notif_newHand(args) {
      // We received a new full hand of 13 cards.
      this.handStock.removeAll();
      this.handStock.addCards(this.remapToBgaCardList(args.hand));
    }

    notif_playCard(args) {
      // Play a card on the table
      //this.tableauStocks[args.player_id].addCards([args.card]);
      this.tableauStocks[args.player_id].addCard(this.remapToBgaCard(args.card));
    }

    async notif_trickWin() {
    // We do nothing here (just wait in order players can view the 4 cards played before they're gone)
    }

    async notif_giveAllCardsToPlayer(args) {
        // Move all cards on table to given table, then destroy them
        const winner_id = args.player_id;

        const cards = this.remapToBgaCardList(args.cards);
        await this.tableauStocks[winner_id].addCards(cards);
        await this.cardsManager.placeCards(cards); // auto-placement
    }

    /*
    Example:
    async notif_cardPlayed( args ) {
        // Note: args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
        
        // TODO: play the card in the user interface.
    }
    */
}
