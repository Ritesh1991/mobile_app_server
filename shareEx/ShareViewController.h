//
//  ShareViewController.h
//  shareTest
//
//  Created by Lokesh Patel on 27/10/15.
//
//
//@property NSURL *imageExtensionUrl;
#import <UIKit/UIKit.h>
#import <Social/Social.h>
#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>

@interface ShareViewController : CDVViewController

+ (void) setShareVaribleHandle:(ShareViewController *)responder;
//Getter method
+ (ShareViewController*) getShareVaribleHandle;

+ (void) shareResult:(NSString *)error Handle:(ShareViewController *)responder;


@end
@interface ShareViewCommandDelegate : CDVCommandDelegateImpl
@end

@interface ShareViewCommandQueue : CDVCommandQueue
@end