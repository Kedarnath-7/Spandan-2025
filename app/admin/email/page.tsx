'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Send, Loader2, Plus, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { emailService } from '@/lib/services/emailService';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  user_id: string;
  email: string;
  email_type: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  todaySent: number;
  templatesCount: number;
}

export default function AdminEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    todaySent: 0,
    templatesCount: 0
  });
  
  // Template Editor State
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    type: '',
    subject: '',
    body: ''
  });
  
  // Bulk Email State
  const [bulkForm, setBulkForm] = useState({
    template: '',
    filter: 'all',
    subject: '',
    body: ''
  });
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  
  // Filters
  const [logFilter, setLogFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTemplates(),
        loadLogs()
      ]);
      await loadStats();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const result = await emailService.getTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const result = await emailService.getLogs();
      if (result.success) {
        setLogs(result.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadStats = async () => {
    // Calculate stats from logs and templates
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.sent_at).toDateString() === today);
    
    setStats({
      totalSent: logs.filter(log => log.status === 'sent').length,
      totalFailed: logs.filter(log => log.status === 'failed').length,
      todaySent: todayLogs.filter(log => log.status === 'sent').length,
      templatesCount: templates.length
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.type || !templateForm.subject || !templateForm.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all template fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await emailService.saveTemplate(
        templateForm.type,
        templateForm.subject,
        templateForm.body
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Template saved successfully'
        });
        await loadTemplates();
        setIsEditingTemplate(false);
        setTemplateForm({ type: '', subject: '', body: '' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      });
    }
  };

  const handleSendBulkEmail = async () => {
    if (!bulkForm.template || !bulkForm.subject || !bulkForm.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all bulk email fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingBulk(true);
    try {
      const result = await emailService.sendBulkEmail(
        bulkForm.template,
        bulkForm.filter,
        bulkForm.subject,
        bulkForm.body
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Bulk email sent to ${result.sentCount || 0} recipients`
        });
        await loadLogs();
        setBulkForm({ template: '', filter: 'all', subject: '', body: '' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send bulk email',
        variant: 'destructive'
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  const formatTemplateType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'approval_tier': 'Tier/Pass Approval',
      'approval_event': 'Event Registration Approval',
      'bulk_announcement': 'Bulk Announcement',
      'welcome': 'Welcome Email',
      'reminder': 'Payment Reminder'
    };
    return typeMap[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id.includes(searchTerm);
    
    const matchesFilter = logFilter === 'all' || 
      (logFilter === 'sent' && log.status === 'sent') ||
      (logFilter === 'failed' && log.status === 'failed');
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-32 w-16 h-16 border-4 border-blue-400 transform rotate-45 opacity-20"></div>
          <div className="absolute bottom-32 left-32 w-12 h-12 border-4 border-yellow-400 transform rotate-12 opacity-20"></div>
          <div className="absolute top-1/2 left-10 w-8 h-8 bg-red-400 transform rotate-45 opacity-20"></div>
          <div className="absolute top-1/4 right-10 w-10 h-10 bg-green-400 transform rotate-12 opacity-20"></div>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Loading Content */}
        <div className="relative z-10 pt-24 pb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xl">Loading email management...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-32 w-16 h-16 border-4 border-blue-400 transform rotate-45 opacity-20"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 border-4 border-yellow-400 transform rotate-12 opacity-20"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-red-400 transform rotate-45 opacity-20"></div>
        <div className="absolute top-1/4 right-10 w-10 h-10 bg-green-400 transform rotate-12 opacity-20"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
                className="bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Email Management</h1>
                <p className="text-gray-300">Manage email templates and campaigns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadData}
                className="bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Mail className="w-8 h-8 text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm text-slate-400">Total Sent</p>
                    <p className="text-2xl font-bold text-white">{stats.totalSent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="w-8 h-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Total Failed</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFailed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Send className="w-8 h-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Today Sent</p>
                  <p className="text-2xl font-bold text-white">{stats.todaySent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit className="w-8 h-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm text-slate-400">Templates</p>
                  <p className="text-2xl font-bold text-white">{stats.templatesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Main Content */}
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <TabsTrigger 
                value="templates" 
                className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700/50"
              >
                Email Templates
              </TabsTrigger>
              <TabsTrigger 
                value="bulk" 
                className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700/50"
              >
                Bulk Email
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700/50"
              >
                Email Logs
              </TabsTrigger>
            </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Email Templates</CardTitle>
                  <Button
                    onClick={() => {
                      setTemplateForm({ type: '', subject: '', body: '' });
                      setIsEditingTemplate(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="bg-slate-700/30 border-slate-600/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                            {formatTemplateType(template.type)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTemplateForm({
                                type: template.type,
                                subject: template.subject,
                                body: template.body
                              });
                              setSelectedTemplate(template);
                              setIsEditingTemplate(true);
                            }}
                            className="text-slate-400 hover:text-white hover:bg-slate-600/50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        <h3 className="font-medium text-white mb-2">{template.subject}</h3>
                        <p className="text-sm text-slate-400 line-clamp-3">
                          {template.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Updated: {new Date(template.updated_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {templates.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400">
                      No email templates found. Create your first template!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Email Tab */}
          <TabsContent value="bulk">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Send Bulk Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Template Type
                    </label>
                    <Select value={bulkForm.template} onValueChange={(value) => setBulkForm({...bulkForm, template: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="bulk_announcement">Bulk Announcement</SelectItem>
                        <SelectItem value="welcome">Welcome Email</SelectItem>
                        <SelectItem value="reminder">Payment Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Recipients Filter
                    </label>
                    <Select value={bulkForm.filter} onValueChange={(value) => setBulkForm({...bulkForm, filter: value})}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Confirmed Users</SelectItem>
                        <SelectItem value="approved">Only Approved</SelectItem>
                        <SelectItem value="paid">Only Paid</SelectItem>
                        <SelectItem value="event">Event Registrants</SelectItem>
                        <SelectItem value="tier">Tier Registrants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Subject
                  </label>
                  <Input
                    value={bulkForm.subject}
                    onChange={(e) => setBulkForm({...bulkForm, subject: e.target.value})}
                    placeholder="Enter email subject"
                    className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Body
                  </label>
                  <Textarea
                    value={bulkForm.body}
                    onChange={(e) => setBulkForm({...bulkForm, body: e.target.value})}
                    placeholder="Enter email body (HTML supported)"
                    rows={8}
                    className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm"
                  />
                </div>

                <Button
                  onClick={handleSendBulkEmail}
                  disabled={isSendingBulk}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSendingBulk ? (
                    <React.Fragment>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Send className="w-4 h-4 mr-2" />
                      Send Bulk Email
                    </React.Fragment>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Email Logs</CardTitle>
                  <div className="flex items-center space-x-3">
                    <Input
                      placeholder="Search by email or user ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm"
                    />
                    <Select value={logFilter} onValueChange={setLogFilter}>
                      <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600/50">
                        <th className="text-left py-3 px-4 font-medium text-slate-300">User ID</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                          <td className="py-3 px-4 text-slate-300">{log.user_id}</td>
                          <td className="py-3 px-4 text-slate-300">{log.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-slate-600/50 text-slate-300">
                              {formatTemplateType(log.email_type)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={log.status === 'sent' ? 'default' : 'destructive'}
                              className={log.status === 'sent' ? 'bg-green-600/80' : 'bg-red-600/80'}
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(log.sent_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      No email logs found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
        <DialogContent className="max-w-2xl bg-slate-800/90 border-slate-700/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Template Type
              </label>
              <Select value={templateForm.type} onValueChange={(value) => setTemplateForm({...templateForm, type: value})}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="approval_tier">Tier/Pass Approval</SelectItem>
                  <SelectItem value="approval_event">Event Registration Approval</SelectItem>
                  <SelectItem value="bulk_announcement">Bulk Announcement</SelectItem>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="reminder">Payment Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Subject
              </label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                placeholder="Enter email subject"
                className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Body
              </label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                placeholder="Enter email body (HTML supported)"
                rows={10}
                className="bg-slate-700/50 border-slate-600/50 text-white backdrop-blur-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditingTemplate(false)}
                className="border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-700/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
