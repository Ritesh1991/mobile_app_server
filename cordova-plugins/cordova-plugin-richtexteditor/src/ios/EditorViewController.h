
#import "ZSSRichTextEditor.h"

@interface EditorViewController : ZSSRichTextEditor

@property (strong, nonatomic) NSString *content;

@property(copy,nonatomic)void (^editDoneBlock)(NSDictionary *result);

-(instancetype)initWithHtml:(NSString *)html;

@end
