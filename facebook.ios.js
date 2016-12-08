var application = require('application')

var Facebook = function(){

    Facebook.logInWithPublishPermissions = function(permissions){
        if(this._isInit){
            this.loginManager.logInWithPublishPermissionsHandler(permissions, this._callbackManager);
        }
    }

    Facebook.logInWithReadPermissions = function(permissions){
        if (this._isInit) {
            this.loginManager.logInWithReadPermissionsHandler(permissions, this._callbackManager);
        }        
    }

    Facebook.getAccessToken = function(){
        console.log("getAccessToken")
        var accessToken = FBSDKAccessToken.currentAccessToken()

        console.log("getAccessToken accessToken=" + accessToken)

        return accessToken
    }

    Facebook.isLoggedIn = function(){
        console.log("isLoggedIn")
        return this.getAccessToken() != null
    }

    Facebook.logout = function(){
        if(this._init)
            this.loginManager.logOut();
    }

    Facebook.initSdk = function(loginBehavior){
        this.loginManager = FBSDKLoginManager.alloc().init();
        if (this.loginManager) {
            //this.loginManager.logOut();
            if (loginBehavior) {
                this.loginManager.loginBehavior = loginBehavior;
            }
            this._isInit = true;
            return true;
        }
        else {
            return false;
        }        
    }

    Facebook.registerCallback = function(successCallback, cancelCallback, failCallback){

        this._successCallback = successCallback
        this._cancelCallback = cancelCallback
        this._failCallback = failCallback
        var self = this
        if (this._isInit) {
            this._callbackManager = function (result, error) {
                if (error) {
                    self.handlerError(error)
                    return;
                }
                if (!result) {
                    self._failCallback("Null error");
                    return;
                }

                console.log("## result=" + result)

                if (result.isCancelled) {
                    self._cancelCallback();
                    return;
                }
                if (result.token) {
                    self._successCallback(result);
                }
                else {
                    self._failCallback("Could not acquire an access token");
                    return;
                }
            };
        }
    }

    // args = {fields , doneCallback }
    Facebook.requestUserProfile = function(args){   

        this.doMeRequest({
            params: {
                fields: args.fields || {}
            },
            doneCallback: function(result){            
                console.log("## result=" + result)
                args.doneCallback({
                    email: result.objectForKey('email'),
                    id: result.objectForKey('id'),
                    name: result.objectForKey('name'),
                })
            }
        })   
    }    

    // url, title, content, imageUrl
    Facebook.share = function(params){

        try{
            var content = FBSDKShareLinkContent.alloc().init()

           if(params.url)
                content.contentURL = NSURL.URLWithString(params.url)

            if(params.title)
                content.contentTitle = params.title

            if(params.content)
                content.contentDescription = params.content

            if(params.imageUrl){                
                content.imageURL = NSURL.URLWithString(params.imageUrl)
            }

            var view = application.ios.rootController

            var mydelegate = this.createSharingDelegate()

            FBSDKShareDialog.showFromViewControllerWithContentDelegate(view, content, mydelegate);
        }catch(error){
            console.log("## error=" + error)
            this._failCallback(error)
        }
    }

    // imagePath, content, imageUrl
    Facebook.sharePhoto = function(args){
        try{

            if(!this.isInstalled()){
                this._failCallback("facebook app not installed")
                return
            }

            var content = FBSDKSharePhotoContent.alloc().init()

            var photo = this.createPhotoShare(args)
            content.photos = [photo];    
            var view = application.ios.rootController
            
            
            var mydelegate = this.createSharingDelegate()

            FBSDKShareDialog.showFromViewControllerWithContentDelegate(view, content, mydelegate);

        }catch(error){
            console.log("## error=" + error)
            this._failCallback(error)            
        }
    }

    // args = list of {imagePath, content, imageUrl} 
    Facebook.sharePhotos = function(args){

        try{

            if(!this.isInstalled()){
                this._failCallback("facebook app not installed")
                return
            }
            
          var content = FBSDKSharePhotoContent.alloc().init()
          var photos = []

          for(var i in args.list){
            photos.push(this.createPhotoShare(args.list[i]))
          }

          content.photos = photos;    


          var view = application.ios.rootController

          var mydelegate = this.createSharingDelegate()
          FBSDKShareDialog.showFromViewControllerWithContentDelegate(view, content, mydelegate);

        }catch(error){
            console.log("## error=" + error)
            this._failCallback(error)            
        }
    }

    Facebook.isInstalled = function(){
        var nsUrl = NSURL.URLWithString("fbapi://")
        var isInstalled = UIApplication.sharedApplication().canOpenURL(nsUrl)
        return isInstalled
    }    

    Facebook.createPhotoShare = function(args){

        var photoShare = FBSDKSharePhoto.alloc().init()

        if(args.imagePath)
            photoShare.image = UIImage.imageWithContentsOfFile(args.imagePath);

        if(args.imageUrl)
            photoShare.imageURL = NSURL.URLWithString(args.imageUrl)

        if(args.content)
            photoShare.caption = args.content
        
        photoShare.userGenerated = true;

        return photoShare
    }

    Facebook.doMeRequest = function(args){
        args.path = "me"        
        this.doGraphPathRequest(args)
    }

    Facebook.doGraphPathRequest = function(args){
        var self = this
        args.params = args.params || {}

        console.log("## doGraphPathRequest path=" + args.path + ", args.params=" + JSON.stringify(args.params))
        try{            
            if(this.isLoggedIn()){
                var request = FBSDKGraphRequest.alloc().initWithGraphPathParameters(args.path, args.params);
                request.startWithCompletionHandler(function(connection, result, error){

                    if(error){
                        self.handlerError(error)
                        return
                    }

                    if(!result){
                        self._failCallback("Null error")
                        return
                    }

                    args.doneCallback(result)

                })
            }else{
                self._failCallback("app is not logged in")
            }
        }catch(error){
            console.log("## error=" + error)
            this._failCallback(error)
        }
    }

    Facebook.handlerError = function(error){
        console.log("login error: " + error)                    
        // https://developers.facebook.com/docs/ios/errors
        var message = error.userInfo.objectForKey(FBSDKErrorDeveloperMessageKey)
        this._failCallback(message);        
    }

    Facebook.createSharingDelegate = function(){
        var self = this
        var MySharingDelegate = (function (_super) {
            __extends(MySharingDelegate, _super);
            function MySharingDelegate() {
                _super.apply(this, arguments);
            }
            MySharingDelegate.prototype.sharerDidCompleteWithResults = function (sharer, results) {
                console.log("## delegate sharerDidCompleteWithResults")
            };
            MySharingDelegate.prototype.sharerDidFailWithError = function (sharer, error) {
                console.log("## delegate sharerDidFailWithError " + error)
                self._failCallback(error)
            };
            MySharingDelegate.prototype.sharerDidCancel = function (sharer) {
                console.log("## delegate sharerDidCancel")
            };

            MySharingDelegate.ObjCProtocols = [FBSDKSharingDelegate];

            return MySharingDelegate;

        }(UIResponder)); 

        return new MySharingDelegate()   
    }
    return Facebook

}

exports.Facebook = Facebook
