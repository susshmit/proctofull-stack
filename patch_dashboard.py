import re

filepath = "c:/Users/SUSHMIT/Downloads/ProctorGuard-Final/src/pages/AdminDashboard.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# I need to insert the TabsContent for "manage" right before the TabsContent for "create"

manage_tab_content = """
          {/* Manage Exams */}
          <TabsContent value="manage">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-mono text-muted-foreground">Manage Created Exams</h2>
                </div>
                <Button onClick={() => setActiveTab("create")} size="sm" variant="outline" className="h-8 font-mono text-xs">
                  <PlusCircle className="mr-2 h-3.5 w-3.5" />
                  New Exam
                </Button>
              </div>

              {exams.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-sm font-mono">
                  No exams created yet. Click 'New Exam' to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {exams.map((exam) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-5 border border-border"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{exam.title}</h3>
                            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30">
                              {exam.duration_minutes || exam.duration} min
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Created: {new Date(exam.created_at || exam.scheduledAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {exam.total_questions || exam.totalQuestions} Questions
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="font-mono text-xs"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${exam.title}"? This cannot be undone.`)) {
                                try {
                                  await deleteExam(exam.id);
                                  setExams(exams.filter(e => e.id !== exam.id));
                                } catch (err: any) {
                                  alert(`Failed to delete exam: ${err.message}`);
                                }
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Exam
                          </Button>
                        </div>
                      </div>

                      {/* Allowed Students List */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-xs font-semibold font-mono text-muted-foreground mb-3 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          Enrolled Students ({exam.allowed_students?.length || 0})
                        </h4>
                        
                        {!exam.allowed_students || exam.allowed_students.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic font-mono bg-muted/30 p-2 rounded-md inline-block">
                            Open to all students
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {exam.allowed_students.map((email: string) => (
                              <Badge 
                                key={email} 
                                variant="secondary" 
                                className="pl-3 pr-1 py-1 flex items-center gap-2 font-mono text-xs bg-background border-border"
                              >
                                {email}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground ml-1"
                                  onClick={async () => {
                                    if (confirm(`Remove ${email} from this exam?`)) {
                                      try {
                                        await removeStudentFromExam(exam.id, email);
                                        // Update local state
                                        setExams(exams.map(e => {
                                          if (e.id === exam.id) {
                                            return { ...e, allowed_students: e.allowed_students.filter((s: string) => s !== email) };
                                          }
                                          return e;
                                        }));
                                      } catch (err: any) {
                                        alert(`Failed to remove student: ${err.message}`);
                                      }
                                    }
                                  }}
                                >
                                  ×
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Create Exam */}
"""

content = content.replace("          {/* Create Exam */}", manage_tab_content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched requested code.")
