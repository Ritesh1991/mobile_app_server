
#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVPluginResult.h>

@interface RichTextEditor : CDVPlugin {}

- (void) edit:(CDVInvokedUrlCommand*)command;

@end

