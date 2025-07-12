/* global $CC, Utils, $SD */

/**
 * Here are a couple of wrappers we created to help ypu quickly setup
 * your plugin and subscribe to events sent by Stream Deck to your plugin.
 */

// Use console logging for SDK v2 compatibility
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};

 /**
  * The 'connected' event is sent to your plugin, after the plugin's instance
  * is registered with Stream Deck software. It carries the current websocket
  * and other information about the current environmet in a JSON object
  * You can use it to subscribe to events you want to use in your plugin.
  */

$SD.on('connected', (conn) => connected(conn));

function connected(jsn) {
    /** subscribe to the willAppear and other events */
    $SD.on('org.andypiper.mastodon.post.willAppear', (jsonObj) => post.onWillAppear(jsonObj));
    $SD.on('org.andypiper.mastodon.post.keyUp', (jsonObj) => post.onKeyUp(jsonObj));
    $SD.on('org.andypiper.mastodon.post.didReceiveSettings', (jsonObj) => post.onDidReceiveSettings(jsonObj));
    $SD.on('org.andypiper.mastodon.post.propertyInspectorDidAppear', (jsonObj) => {
        logger.info('Property Inspector appeared');
    });
    $SD.on('org.andypiper.mastodon.post.propertyInspectorDidDisappear', (jsonObj) => {
        logger.info('Property Inspector disappeared');
    });
};

/** ACTIONS */

const post = {
    settings:{},
    onDidReceiveSettings: function(jsn) {
        logger.info('Settings received');

        this.settings = Utils.getProp(jsn, 'payload.settings', {});
        
        /**
         * In this example we put a HTML-input element with id='mynameinput'
         * into the Property Inspector's DOM. If you enter some data into that
         * input-field it get's saved to Stream Deck persistently and the plugin
         * will receice the updated 'didReceiveSettings' event.
         * Here we look for this setting and use it to change the title of
         * the key.
         */

         this.setTitle(jsn);
    },

    /** 
     * The 'willAppear' event is the first event a key will receive, right before it gets
     * showed on your Stream Deck and/or in Stream Deck software.
     * This event is a good place to setup your plugin and look at current settings (if any),
     * which are embedded in the events payload.
     */

    onWillAppear: function (jsn) {
        logger.info('Action will appear', jsn.payload.settings);
        /**
         * "The willAppear event carries your saved settings (if any). You can use these settings
         * to setup your plugin or save the settings for later use. 
         * If you want to request settings at a later time, you can do so using the
         * 'getSettings' event, which will tell Stream Deck to send your data 
         * (in the 'didReceiceSettings above)
         * 
         * $SD.api.getSettings(jsn.context);
        */
        this.settings = jsn.payload.settings;

        this.setTitle(jsn);
    },

    onKeyUp: function (jsn) {
        this.settings = jsn.payload.settings; 
        this.toot(jsn);
    },

    /**
     * Here's a quick demo-wrapper to show how you could change a key's title based on what you
     * stored in settings.
     * If you enter something into Property Inspector's name field (in this demo),
     * it will get the title of your key.
     * 
     * @param {JSON} jsn // the JSON object passed from Stream Deck to the plugin, which contains the plugin's context
     * 
     */

    setTitle: function(jsn) {
        // Keep button title static - don't show message preview
        $SD.api.setTitle(jsn.context, "");
    },

    toot: function(inJsonData) {
        // Validate settings before posting
        if (!this.settings.token) {
            logger.error('No access token configured');
            $SD.api.showAlert(inJsonData.context);
            return;
        }
        
        if (!this.settings['mastodon-instance']) {
            logger.error('No Mastodon instance configured');
            $SD.api.showAlert(inJsonData.context);
            return;
        }
        
        if (!this.settings.toot) {
            logger.error('No message to post');
            $SD.api.showAlert(inJsonData.context);
            return;
        }

        // Validate instance URL format and enforce HTTPS
        let instanceUrl = this.settings['mastodon-instance'].trim();
        if (!instanceUrl.startsWith('http://') && !instanceUrl.startsWith('https://')) {
            instanceUrl = 'https://' + instanceUrl;
        }
        if (instanceUrl.startsWith('http://')) {
            instanceUrl = instanceUrl.replace('http://', 'https://');
            logger.warn('Upgraded HTTP to HTTPS for security');
        }
        
        // Validate message length (Mastodon limit is 500 characters)
        if (this.settings.toot.length > 500) {
            logger.error('Message too long', { length: this.settings.toot.length, max: 500 });
            $SD.api.showAlert(inJsonData.context);
            return;
        }

        const mastodon_api_url = `${instanceUrl}/api/v1/statuses`;
        const fdata = new FormData();
        fdata.append("status", this.settings.toot);
        
        // Add visibility control (default to public)
        const visibility = this.settings.visibility || "public";
        fdata.append("visibility", visibility);
        
        // Add language if specified
        if (this.settings.language) {
            fdata.append("language", this.settings.language);
        }
        
        // Generate idempotency key to prevent duplicate posts within a short time window
        // Uses 5-minute intervals so same message can be reposted later but prevents rapid duplicates
        const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute intervals
        const messageHash = this.settings.toot.substring(0, 20).replace(/\W/g, ''); // First 20 chars, alphanumeric only
        const idempotencyKey = `streamdeck-${timeWindow}-${messageHash}`;
        
        logger.info('Posting to Mastodon', { 
            messageLength: this.settings.toot.length, 
            instance: instanceUrl, 
            visibility: visibility,
            language: this.settings.language || 'auto',
            idempotencyKey: idempotencyKey,
            timeWindow: timeWindow,
            messageHash: messageHash
        });
        
        fetch(mastodon_api_url, {
            headers: { 
                'Accept': 'application/json', 
                'Authorization': 'Bearer ' + this.settings.token,
                'User-Agent': 'StreamDeck-Mastodon-Plugin/2.0.0',
                'Idempotency-Key': idempotencyKey
            },
            method: 'POST',
            body: fdata
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            logger.info('Successfully posted to Mastodon', { postId: data.id, url: data.url });
            $SD.api.showOk(inJsonData.context);
        })
        .catch(error => {
            logger.error('Error posting to Mastodon', error);
            $SD.api.showAlert(inJsonData.context);
        });
    },

};

