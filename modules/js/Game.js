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
            const playableCardsIds = args.playableCardsIds; // returned by the PlayerTurn::getArgs

            // Add test action buttons in the action status bar, simulating a card click:
            playableCardsIds.forEach(
                cardId => this.bga.statusBar.addActionButton(_('Play card with id ${card_id}').replace('${card_id}', cardId), () => this.onCardClick(cardId))
            ); 

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

    
    onCardClick(card_id) {
        console.log( 'onCardClick', card_id );

        this.bga.actions.performAction("actPlayCard", { 
            card_id,
        }).then(() =>  {                
            // What to do after the server call if it succeeded
            // (most of the time, nothing, as the game will react to notifs / change of state instead, so you can delete the `then`)
        });        
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
            <div id="tableau_${player.id}"></div>
        </div>
        `
            );
        });
        
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
            document.getElementById("myhand")
        );

        this.handStock.setSelectionMode("single");
        this.handStock.onCardClick = (card) => {
            alert("boom!");
        };

        // TODO: fix handStock
        this.handStock.addCards([
            { id: 1, type: 2, type_arg: 4 }, // 4 of hearts
            { id: 2, type: 3, type_arg: 11 }, // Jack of clubs
        ]); 

        // map stocks
        this.tableauStocks = [];
        Object.values(gamedatas.players).forEach((player, index) => {
            // add player tableau stock
            this.tableauStocks[player.id] = new BgaCards.LineStock(
                this.cardsManager,
                document.getElementById(`tableau_${player.id}`)
            );

            // TODO: fix tableauStocks
            this.tableauStocks[player.id].addCards([
                { id: index + 10, type: index + 1, type_arg: index + 2 },
            ]);
        });

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
    
    /*
    Example:
    async notif_cardPlayed( args ) {
        // Note: args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
        
        // TODO: play the card in the user interface.
    }
    */
}
