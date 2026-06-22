import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { 
  setCurrentFolder, 
  setSelectedThread, 
  toggleSidebar,
  setPreviewPaneVisible 
} from '@/redux/features/message/messageSlice';
import { FolderType } from '@/types/message';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { 
  Menu, 
  Search, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import MessageSidebar from './MessageSidebar';
import MessageList from './MessageList';
import MessageThread from './MessageThread';
import MessageCompose from './MessageCompose';
import MessageSearch from './MessageSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const MessageLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const {
    sidebarCollapsed,
    previewPaneVisible,
    selectedThreadId,
    isComposing,
    currentFolder
  } = useAppSelector((state) => state.message);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            setSearchOpen(true);
            break;
          case 'n':
            event.preventDefault();
            // Start composing new message
            break;
          case 'b':
            event.preventDefault();
            dispatch(toggleSidebar());
            break;
          case 'p':
            event.preventDefault();
            dispatch(setPreviewPaneVisible(!previewPaneVisible));
            break;
        }
      }
      
      // Escape key handling
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, previewPaneVisible]);

  const handleFolderSelect = (folderType: FolderType, folderId?: string) => {
    dispatch(setCurrentFolder({ folderType, folderId }));
    if (isMobile) {
      setMobileSheetOpen(false);
    }
  };

  const handleThreadSelect = (threadId: string) => {
    dispatch(setSelectedThread(threadId));
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <MessageSidebar 
                  onFolderSelect={handleFolderSelect}
                  currentFolder={currentFolder}
                />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile content */}
        <div className="flex-1 overflow-hidden">
          {selectedThreadId ? (
            <MessageThread 
              threadId={selectedThreadId}
              onBack={() => dispatch(setSelectedThread(undefined))}
            />
          ) : (
            <MessageList 
              onThreadSelect={handleThreadSelect}
              currentFolder={currentFolder}
            />
          )}
        </div>

        {/* Mobile compose modal */}
        {isComposing && <MessageCompose />}
        
        {/* Mobile search modal */}
        {searchOpen && (
          <MessageSearch 
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Desktop header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => dispatch(toggleSidebar())}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSearchOpen(true)}
            title="Search messages (Ctrl+K)"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => dispatch(setPreviewPaneVisible(!previewPaneVisible))}
            title={previewPaneVisible ? "Hide preview" : "Show preview"}
          >
            {previewPaneVisible ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Desktop content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <MessageSidebar 
                  onFolderSelect={handleFolderSelect}
                  currentFolder={currentFolder}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Message list */}
          <ResizablePanel 
            defaultSize={previewPaneVisible ? 40 : 80} 
            minSize={30}
          >
            <MessageList 
              onThreadSelect={handleThreadSelect}
              currentFolder={currentFolder}
            />
          </ResizablePanel>

          {/* Preview pane */}
          {previewPaneVisible && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={30}>
                {selectedThreadId ? (
                  <MessageThread threadId={selectedThreadId} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-white">
                    <div className="text-center text-gray-500">
                      <div className="text-lg font-medium mb-2">No message selected</div>
                      <div className="text-sm">Choose a message to read</div>
                    </div>
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Desktop compose modal */}
      {isComposing && <MessageCompose />}
      
      {/* Desktop search modal */}
      {searchOpen && (
        <MessageSearch 
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
};

export default MessageLayout;
