import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Loader, Calendar, User, ListChecks, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import { ProjectTask, Project } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    myTasks, 
    allProjects, 
    projectProgress, 
    projectTotalSteps, 
    projectFMSDetails,
    loadMyTasks, 
    loadProjects,
    loading,
    error,
    setError
  } = useData();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'all-projects'>('my-tasks');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.username) {
      loadMyTasks(user.username);
      // Projects will be loaded automatically by DataContext
    }
  }, [user?.username, loadMyTasks]);


  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getAllTasksForProject = (project: Project) => {
    const fmsDetails = projectFMSDetails[project.projectId];
    if (!fmsDetails || !fmsDetails.steps) {
      return project.tasks; // Fallback to existing tasks
    }

    // Create a map of existing tasks by step number
    const existingTasksMap = new Map();
    project.tasks.forEach(task => {
      existingTasksMap.set(task.stepNo, task);
    });

    // Combine FMS steps with existing tasks
    return fmsDetails.steps.map((step: any) => {
      const existingTask = existingTasksMap.get(step.stepNo);
      
      if (existingTask) {
        // Return the existing task with all its data
        return existingTask;
      } else {
        // Create a placeholder task for future steps
        return {
          stepNo: step.stepNo,
          what: step.what,
          who: step.who,
          how: step.how,
          status: 'Not Started' as const,
          plannedDueDate: '',
          actualCompletedOn: '',
          completedBy: '',
          projectId: project.projectId,
          projectName: project.projectName,
          isFirstStep: false,
          isOverdue: false
        };
      }
    });
  };

  const isTaskOverdue = (task: ProjectTask): boolean => {
    if (task.status === 'Done') return false;
    const dueDate = new Date(task.plannedDueDate);
    const now = new Date();
    return dueDate < now;
  };

  const getCompletionStatus = (task: ProjectTask): 'on-time' | 'late' | undefined => {
    if (task.status !== 'Done' || !task.actualCompletedOn) return undefined;
    const dueDate = new Date(task.plannedDueDate);
    const completedDate = new Date(task.actualCompletedOn);
    return completedDate <= dueDate ? 'on-time' : 'late';
  };

  const updateStatus = async (task: ProjectTask, newStatus: string) => {
    if (!task.rowIndex) return;

    setUpdating(task.rowIndex);
    try {
      const result = await api.updateTaskStatus(task.rowIndex, newStatus, user!.username);

      if (result.success) {
        // Refresh data after successful update
        if (user) {
          loadMyTasks(user.username);
          // Projects will be refreshed automatically by DataContext
        }
      } else {
        setError(result.message || 'Failed to update task');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Started':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Filter projects to show only user-related ones
  const userProjects = allProjects.filter((project: Project) =>
    project.tasks.some((task) => task.who === user?.username || task.who === user?.department)
  );

  if (loading.myTasks || loading.projects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-slate-600 mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8" />
          Dashboard
        </h1>

        <div className="border-b border-slate-200 mb-4 sm:mb-6 overflow-x-auto">
          <div className="flex gap-2 sm:gap-4 min-w-max">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`pb-3 px-3 sm:px-4 font-medium transition-colors relative text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'my-tasks'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Tasks ({myTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('all-projects')}
              className={`pb-3 px-3 sm:px-4 font-medium transition-colors relative text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'all-projects'
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Projects ({allProjects.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activeTab === 'my-tasks' && (
          <div>
            {myTasks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <ListChecks className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4 text-sm sm:text-base">No tasks assigned to you</p>
                <button
                  onClick={() => navigate('/start-project')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm sm:text-base"
                >
                  Start New Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myTasks.map((task) => (
                  <div
                    key={`${task.projectId}-${task.stepNo}`}
                    className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${
                      task.isOverdue && task.status !== 'Done'
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-base sm:text-lg">
                          {task.projectName} - Step {task.stepNo}
                        </h3>
                        <p className="text-slate-600 mt-1 text-sm sm:text-base">{task.what}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                        {task.isOverdue && task.status !== 'Done' && (
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                        {task.status === 'Done' && task.completionStatus && (
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
                              task.completionStatus === 'on-time'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-orange-100 text-orange-800 border-orange-200'
                            }`}
                          >
                            {task.completionStatus === 'on-time' ? 'On Time' : 'Late'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="break-words">
                          <strong>Who:</strong> {task.who}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="break-words">
                          <strong>Due:</strong> {formatDate(task.plannedDueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-50 rounded-lg text-xs sm:text-sm">
                      <strong className="text-slate-700">How:</strong>
                      <p className="text-slate-600 mt-1 break-words">{task.how}</p>
                    </div>

                    {task.status === 'Pending' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => updateStatus(task, 'Done')}
                          disabled={updating === task.rowIndex}
                          className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm w-full sm:w-auto"
                        >
                          {updating === task.rowIndex ? 'Updating...' : 'Complete'}
                        </button>
                      </div>
                    )}

                    {task.actualCompletedOn && (
                      <div className="mt-2 text-xs sm:text-sm">
                        <span className="text-green-600">
                          Completed on: {formatDate(task.actualCompletedOn)}
                        </span>
                        {task.completedBy && (
                          <span className="text-slate-600 ml-2">by {task.completedBy}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all-projects' && (
          <div>
            {userProjects.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <ListChecks className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4 text-sm sm:text-base">No projects available</p>
                <button
                  onClick={() => navigate('/start-project')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm sm:text-base"
                >
                  Start New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {userProjects.map((project) => {
                  const progress = projectProgress[project.projectId] || 0;
                  const isExpanded = expandedProjects.has(project.projectId);

                  return (
                    <div
                      key={project.projectId}
                      className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div
                        className="p-4 bg-slate-50 cursor-pointer"
                        onClick={() => toggleProjectExpanded(project.projectId)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-slate-900">{project.projectName}</h3>
                          <span className="text-sm text-slate-600">
                            {project.tasks.filter((t) => t.status === 'Done').length} /{' '}
                            {projectTotalSteps[project.projectId] || project.tasks.length} tasks
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
                          <div
                            className="bg-slate-900 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{progress}% Complete</span>
                          <button className="text-slate-600 hover:text-slate-900">
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-slate-200">
                          <div className="space-y-3">
                            {getAllTasksForProject(project).map((task) => {
                              const taskOverdue = isTaskOverdue(task);
                              const taskCompletionStatus = getCompletionStatus(task);

                              return (
                                <div
                                  key={task.stepNo}
                                  className={`border rounded-lg p-3 ${
                                    taskOverdue && task.status !== 'Done'
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-slate-200 bg-slate-50'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                                        {task.stepNo}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-900">{task.what}</p>
                                        <p className="text-xs text-slate-600 mt-1">
                                          Assigned to: {task.who}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                          task.status
                                        )}`}
                                      >
                                        {task.status}
                                      </span>
                                      {taskOverdue && task.status !== 'Done' && (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          Overdue
                                        </span>
                                      )}
                                      {task.status === 'Done' && taskCompletionStatus && (
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                            taskCompletionStatus === 'on-time'
                                              ? 'bg-green-100 text-green-800 border-green-200'
                                              : 'bg-orange-100 text-orange-800 border-orange-200'
                                          }`}
                                        >
                                          {taskCompletionStatus === 'on-time' ? 'On Time' : 'Late'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-600 mt-2">
                                    {task.plannedDueDate ? (
                                      <div>Due: {formatDate(task.plannedDueDate)}</div>
                                    ) : (
                                      <div className="text-gray-500">Due: TBD (Not started yet)</div>
                                    )}
                                    {task.actualCompletedOn && (
                                      <div className="text-green-600">
                                        Completed: {formatDate(task.actualCompletedOn)}
                                        {task.completedBy && ` by ${task.completedBy}`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
