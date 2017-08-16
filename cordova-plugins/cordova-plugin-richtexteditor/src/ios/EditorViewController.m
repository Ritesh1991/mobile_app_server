
#import "EditorViewController.h"

@interface EditorViewController ()
{
    NSString *_html;
}
@end

@implementation EditorViewController

-(instancetype)initWithHtml:(NSString *)html{
    self = [self init];
    if (self) {
        _html = html;
        
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    //[self setNavigationbar];
    
    UIBarButtonItem *rigntButton = [[UIBarButtonItem alloc]
                                   initWithTitle:@"完成"
                                   style:UIBarButtonItemStylePlain
                                   target:self
                                    action:@selector(editDone:)];
    
    self.navigationItem.title = @"编辑文字";
    self.navigationItem.rightBarButtonItem = rigntButton;
    
    self.view.backgroundColor = [UIColor whiteColor];
    self.enabledToolbarItems = @[
                                 ZSSRichTextEditorToolbarUndo,
                                 ZSSRichTextEditorToolbarRedo,
                                 ZSSRichTextEditorToolbarBold,
                                 ZSSRichTextEditorToolbarItalic,
                                 ZSSRichTextEditorToolbarSubscript,
                                 ZSSRichTextEditorToolbarSuperscript,
                                 ZSSRichTextEditorToolbarStrikeThrough,
                                 ZSSRichTextEditorToolbarUnderline,
                                 //ZSSRichTextEditorToolbarRemoveFormat,
                                 ZSSRichTextEditorToolbarJustifyLeft,
                                 ZSSRichTextEditorToolbarJustifyCenter,
                                 ZSSRichTextEditorToolbarJustifyRight,
                                 ZSSRichTextEditorToolbarJustifyFull,
                                 ZSSRichTextEditorToolbarH1,
                                 ZSSRichTextEditorToolbarH2,
                                 ZSSRichTextEditorToolbarH3,
                                 ZSSRichTextEditorToolbarH4,
                                 ZSSRichTextEditorToolbarH5,
                                 ZSSRichTextEditorToolbarH6,
                                 ZSSRichTextEditorToolbarParagraph,
                                 ZSSRichTextEditorToolbarFonts,
                                 ZSSRichTextEditorToolbarTextColor,
                                 ZSSRichTextEditorToolbarBackgroundColor,
                                 ZSSRichTextEditorToolbarUnorderedList,
                                 ZSSRichTextEditorToolbarOrderedList,
                                 ZSSRichTextEditorToolbarHorizontalRule,
                                 ZSSRichTextEditorToolbarIndent,
                                 ZSSRichTextEditorToolbarOutdent,
                                 //ZSSRichTextEditorToolbarInsertImage,
                                 //ZSSRichTextEditorToolbarInsertImageFromDevice,
                                 //ZSSRichTextEditorToolbarInsertLink,
                                  //ZSSRichTextEditorToolbarRemoveLink,
                                  //ZSSRichTextEditorToolbarQuickLink
                                  
                                  //ZSSRichTextEditorToolbarViewSource,
                                  
                                  //ZSSRichTextEditorToolbarAll,
                                  //ZSSRichTextEditorToolbarNone,
                                  
                                  ];
   
    
    // Set the toolbar item color
    self.toolbarItemTintColor = [UIColor blackColor];
    
    // Set the toolbar selected color
    self.toolbarItemSelectedTintColor = [UIColor blueColor];
    
    //[self setPlaceholder:@"This is a placeholder that will show when there is no content(html)"];
    
    self.alwaysShowToolbar = YES;
    
    self.shouldShowKeyboard = YES;
    
    self.enabledSelectAll = YES;
    
    self.customInsertLink = YES;
    
    // Set the HTML contents of the editor
    [self setHTML:_html];
    
    
}

-(void)editDone:(UIBarButtonItem *)sender{
    
    [self.navigationController dismissViewControllerAnimated:YES completion:nil];
    
    NSDictionary *res = @{@"html":[self getHTML],@"text":[self getText]};
    
    self.editDoneBlock(res);
    
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


@end
