const { useState, useEffect } = React;

const RoomOccupancySystem = () => {
  // LocalStorage keys
  const STORAGE_KEYS = {
    sensors: 'otak-presence-sensors',
    groups: 'otak-presence-groups',
    darkMode: 'otak-presence-dark-mode'
  };

  // Load data from localStorage
  const loadFromStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  // Save data to localStorage
  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  const [sensors, setSensors] = useState(() => loadFromStorage(STORAGE_KEYS.sensors, []));
  const [groups, setGroups] = useState(() => loadFromStorage(STORAGE_KEYS.groups, []));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => loadFromStorage(STORAGE_KEYS.darkMode, true));
  const [newSensor, setNewSensor] = useState({
    uuid: "",
    name: ""
  });
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: ""
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-save to localStorage when state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.sensors, sensors);
  }, [sensors]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.groups, groups);
  }, [groups]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.darkMode, isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const simulateData = () => {
      setSensors(prevSensors => 
        prevSensors.map(sensor => ({
          ...sensor,
          isOccupied: Math.random() > 0.5,
          isOnline: Math.random() > 0.1,
          lastUpdate: new Date().toLocaleTimeString('en-US')
        }))
      );
    };

    const interval = setInterval(simulateData, 30000);
    return () => clearInterval(interval);
  }, []);

  const addSensor = () => {
    if (newSensor.uuid && newSensor.name) {
      const existingSensor = sensors.find(sensor => sensor.uuid === newSensor.uuid);
      if (existingSensor) {
        alert('This UUID is already in use. Please enter a different UUID.');
        return;
      }

      const sensor = {
        id: Date.now(),
        uuid: newSensor.uuid,
        name: newSensor.name,
        groupId: null,
        isOccupied: false,
        isOnline: true,
        lastUpdate: new Date().toLocaleTimeString('en-US'),
        createdAt: new Date()
      };
      
      setSensors(prev => [...prev, sensor]);
      setNewSensor({ uuid: "", name: "" });
      setShowAddModal(false);
    }
  };

  const addGroup = () => {
    if (newGroup.name) {
      const group = {
        id: Date.now(),
        name: newGroup.name,
        description: newGroup.description,
        createdAt: new Date()
      };
      
      setGroups(prev => [...prev, group]);
      setNewGroup({ name: "", description: "" });
      setShowAddGroupModal(false);
    }
  };

  const deleteGroup = (groupId) => {
    setSensors(prev => 
      prev.map(sensor => 
        sensor.groupId === groupId ? { ...sensor, groupId: null } : sensor
      )
    );
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const deleteSensor = (id) => {
    setSensors(prev => prev.filter(sensor => sensor.id !== id));
  };

  const startEdit = (sensor) => {
    setEditingSensor({ ...sensor });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    setSensors(prev => 
      prev.map(sensor => 
        sensor.id === editingSensor.id ? editingSensor : sensor
      )
    );
    setShowEditModal(false);
    setEditingSensor(null);
  };

  const startEditGroup = (group) => {
    setEditingGroup({ ...group });
    setShowEditGroupModal(true);
  };

  const saveEditGroup = () => {
    setGroups(prev =>
      prev.map(group =>
        group.id === editingGroup.id ? editingGroup : group
      )
    );
    setShowEditGroupModal(false);
    setEditingGroup(null);
  };

  const handleDragStart = (e, sensor) => {
    setDraggedItem(sensor);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, groupId = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGroup(groupId);
  };

  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  const handleDrop = (e, targetGroupId = null) => {
    e.preventDefault();
    
    if (draggedItem) {
      setSensors(prev =>
        prev.map(sensor =>
          sensor.id === draggedItem.id
            ? { ...sensor, groupId: targetGroupId }
            : sensor
        )
      );
    }
    
    setDraggedItem(null);
    setDragOverGroup(null);
  };

  const ungroupedSensors = sensors.filter(sensor => sensor.groupId === null);
  const groupedSensors = groups.map(group => ({
    ...group,
    sensors: sensors.filter(sensor => sensor.groupId === group.id)
  }));

  const getGroupStatus = (groupSensors) => {
    const onlineSensors = groupSensors.filter(s => s.isOnline);
    const occupiedSensors = onlineSensors.filter(s => s.isOccupied);
    
    if (onlineSensors.length === 0) {
      return { 
        status: 'no-data', 
        label: 'No Data', 
        color: isDarkMode 
          ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' 
          : 'bg-gray-200 text-gray-600 border-gray-300'
      };
    }
    
    if (occupiedSensors.length > 0) {
      return { 
        status: 'occupied', 
        label: 'Occupied', 
        color: isDarkMode 
          ? 'bg-red-600/20 text-red-300 border-red-600/30' 
          : 'bg-red-100 text-red-700 border-red-300'
      };
    }
    
    return { 
      status: 'vacant', 
      label: 'Vacant', 
      color: isDarkMode 
        ? 'bg-green-600/20 text-green-300 border-green-600/30' 
        : 'bg-green-100 text-green-700 border-green-300'
    };
  };

  const totalSensors = sensors.length;
  const onlineSensors = sensors.filter(sensor => sensor.isOnline).length;
  const occupiedSensors = sensors.filter(sensor => sensor.isOnline && sensor.isOccupied).length;
  const totalGroups = groups.length;

  // Theme classes
  const theme = {
    bg: isDarkMode ? 'bg-slate-800' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-slate-700/80' : 'bg-white',
    border: isDarkMode ? 'border-slate-600/50' : 'border-gray-200',
    text: isDarkMode ? 'text-slate-100' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-slate-300' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    sensorBg: isDarkMode ? 'bg-slate-600/30' : 'bg-gray-50',
    sensorBorder: isDarkMode ? 'border-slate-500/30' : 'border-gray-200',
    modalBg: isDarkMode ? 'bg-slate-700' : 'bg-white',
    modalBorder: isDarkMode ? 'border-slate-600' : 'border-gray-300',
    inputBg: isDarkMode ? 'bg-slate-600' : 'bg-white',
    inputBorder: isDarkMode ? 'border-slate-500' : 'border-gray-300',
    buttonSecondary: isDarkMode ? 'bg-slate-600 hover:bg-slate-500 border-slate-500' : 'bg-gray-200 hover:bg-gray-300 border-gray-300',
    groupHeaderBg: isDarkMode ? 'bg-slate-600/50' : 'bg-gray-100',
    sidebarBg: isDarkMode ? 'bg-slate-600/50' : 'bg-gray-100',
    dragHighlight: isDarkMode ? 'ring-blue-400 bg-slate-600/90' : 'ring-blue-500 bg-blue-50',
    dashedBorder: isDarkMode ? 'border-slate-600' : 'border-gray-300'
  };

  return React.createElement('div', { className: `min-h-screen ${theme.bg} p-4 relative overflow-hidden text-sm` },
    // Background decoration (dark mode only)
    isDarkMode && React.createElement('div', { className: "absolute inset-0 overflow-hidden" },
      React.createElement('div', { className: "absolute top-16 right-24 w-1 h-1 bg-blue-300 rounded-full opacity-60 animate-pulse" }),
      React.createElement('div', { className: "absolute top-32 right-64 w-1 h-1 bg-purple-300 rounded-full opacity-40 animate-pulse" }),
      React.createElement('div', { className: "absolute top-48 right-16 w-1 h-1 bg-pink-300 rounded-full opacity-50 animate-pulse" })
    ),

    React.createElement('div', { className: "max-w-6xl mx-auto relative z-10" },
      // Header
      React.createElement('div', { className: `${theme.cardBg} backdrop-blur border ${theme.border} rounded-lg shadow-md p-4 mb-4` },
        React.createElement('div', { className: "flex justify-between items-center" },
          React.createElement('div', {},
            React.createElement('h1', { className: `text-2xl font-bold ${theme.text} flex items-center gap-3` },
              'otak-presence',
              React.createElement('button', {
                onClick: () => setIsDarkMode(!isDarkMode),
                className: `px-3 py-1 text-xs rounded-md transition-colors ${
                  isDarkMode 
                    ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400' 
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`
              }, isDarkMode ? 'Light' : 'Dark')
            ),
            React.createElement('div', { className: `flex items-center gap-4 mt-2 ${theme.textSecondary} text-xs` },
              React.createElement('div', { className: "flex items-center gap-1" },
                React.createElement('span', { className: "font-mono" }, currentTime.toLocaleString('en-US'))
              ),
              React.createElement('div', { className: "flex items-center gap-1" },
                React.createElement('span', {}, 'Groups: ', React.createElement('span', { className: `font-semibold ${theme.text}` }, totalGroups))
              ),
              React.createElement('div', { className: "flex items-center gap-1" },
                React.createElement('span', {}, 'Sensors: ', React.createElement('span', { className: `font-semibold ${theme.text}` }, totalSensors))
              ),
              React.createElement('div', { className: "flex items-center gap-1" },
                React.createElement('span', {}, 'Online: ', React.createElement('span', { className: `font-semibold ${theme.text}` }, onlineSensors))
              ),
              React.createElement('div', { className: "flex items-center gap-1" },
                React.createElement('span', {}, 'Occupied: ', React.createElement('span', { className: `font-semibold ${theme.text}` }, occupiedSensors))
              )
            )
          ),
          React.createElement('div', { className: "flex gap-2" },
            React.createElement('button', {
              onClick: () => setShowAddGroupModal(true),
              className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium text-sm"
            }, '+ Create Group'),
            React.createElement('button', {
              onClick: () => setShowAddModal(true),
              className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium text-sm"
            }, '+ Add Sensor')
          )
        )
      ),

      React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-4 gap-4" },
        // Left: Group list
        React.createElement('div', { className: "lg:col-span-3 space-y-4" },
          ...groupedSensors.map((group) => {
            const groupStatus = getGroupStatus(group.sensors);
            return React.createElement('div', {
              key: group.id,
              className: `${theme.cardBg} backdrop-blur border ${theme.border} rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                dragOverGroup === group.id ? `ring-2 ${theme.dragHighlight}` : ''
              }`,
              onDragOver: (e) => handleDragOver(e, group.id),
              onDragLeave: handleDragLeave,
              onDrop: (e) => handleDrop(e, group.id)
            },
              React.createElement('div', { className: `${theme.groupHeaderBg} border-b ${theme.border} px-4 py-3` },
                React.createElement('div', { className: "flex justify-between items-center" },
                  React.createElement('div', { className: "flex items-center gap-3" },
                    React.createElement('h2', { className: `text-lg font-bold ${theme.text}` }, group.name),
                    group.description && React.createElement('span', { className: `${theme.textSecondary} text-sm` }, '- ', group.description),
                    React.createElement('div', { className: `px-2 py-1 rounded text-xs font-medium border ${groupStatus.color}` }, groupStatus.label)
                  ),
                  React.createElement('div', { className: "flex items-center gap-3" },
                    React.createElement('div', { className: `${theme.textSecondary} text-xs` },
                      'Sensors: ', React.createElement('span', { className: `font-semibold ${theme.text}` }, group.sensors.length), ' | ',
                      'Online: ', React.createElement('span', { className: `font-semibold ${theme.text}` }, group.sensors.filter(s => s.isOnline).length)
                    ),
                    React.createElement('div', { className: "flex gap-1" },
                      React.createElement('button', {
                        onClick: () => startEditGroup(group),
                        className: `px-2 py-1 ${theme.textSecondary} hover:${theme.text} hover:bg-gray-500/20 rounded text-xs transition-colors duration-200`
                      }, 'Edit'),
                      React.createElement('button', {
                        onClick: () => deleteGroup(group.id),
                        className: `px-2 py-1 ${theme.textSecondary} hover:text-red-500 hover:bg-red-500/20 rounded text-xs transition-colors duration-200`
                      }, 'Delete')
                    )
                  )
                )
              ),

              React.createElement('div', { className: "p-4" },
                group.sensors.length === 0 ? 
                  React.createElement('div', { className: `text-center py-6 ${theme.textMuted} border-2 border-dashed ${theme.dashedBorder} rounded-md` },
                    'Drag and drop sensors here'
                  ) :
                  React.createElement('div', { className: "grid grid-cols-2 gap-3" },
                    ...group.sensors.map((sensor) =>
                      React.createElement('div', {
                        key: sensor.id,
                        draggable: true,
                        onDragStart: (e) => handleDragStart(e, sensor),
                        className: `${theme.sensorBg} border ${theme.sensorBorder} rounded-md p-3 cursor-move transition-all duration-300 hover:shadow-md ${
                          sensor.isOnline 
                            ? sensor.isOccupied 
                              ? 'border-l-4 border-l-red-500' 
                              : 'border-l-4 border-l-green-500'
                            : 'border-l-4 border-l-gray-500'
                        }`
                      },
                        React.createElement('div', { className: "flex justify-between items-start mb-2" },
                          React.createElement('div', { className: "flex-1" },
                            React.createElement('h3', { className: `text-sm font-semibold ${theme.text} mb-1` }, sensor.name),
                            React.createElement('p', { className: `${theme.textMuted} text-xs` }, 'UUID: ', sensor.uuid)
                          ),
                          React.createElement('div', { className: "flex gap-1" },
                            React.createElement('button', {
                              onClick: () => startEdit(sensor),
                              className: `px-1 py-1 ${theme.textSecondary} hover:${theme.text} hover:bg-gray-500/20 rounded text-xs transition-colors duration-200`
                            }, 'Edit'),
                            React.createElement('button', {
                              onClick: () => deleteSensor(sensor.id),
                              className: `px-1 py-1 ${theme.textSecondary} hover:text-red-500 hover:bg-red-500/20 rounded text-xs transition-colors duration-200`
                            }, 'Delete')
                          )
                        ),

                        React.createElement('div', { className: "flex flex-wrap gap-1 mb-2" },
                          React.createElement('div', { 
                            className: `px-2 py-0.5 rounded text-xs font-medium ${
                              sensor.isOnline 
                                ? isDarkMode
                                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                                  : 'bg-green-100 text-green-700 border border-green-300'
                                : isDarkMode
                                  ? 'bg-red-600/20 text-red-300 border border-red-600/30'
                                  : 'bg-red-100 text-red-700 border border-red-300'
                            }`
                          }, sensor.isOnline ? 'Online' : 'Offline'),
                          
                          sensor.isOnline && React.createElement('div', { 
                            className: `px-2 py-0.5 rounded text-xs font-medium ${
                              sensor.isOccupied 
                                ? isDarkMode
                                  ? 'bg-red-600/20 text-red-300 border border-red-600/30'
                                  : 'bg-red-100 text-red-700 border border-red-300'
                                : isDarkMode
                                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                                  : 'bg-green-100 text-green-700 border border-green-300'
                            }`
                          }, sensor.isOccupied ? 'Occupied' : 'Vacant')
                        ),

                        React.createElement('div', { className: `text-xs ${theme.textSecondary}` },
                          'Last update: ', React.createElement('span', { className: theme.text },
                            sensor.isOnline ? sensor.lastUpdate : 'No data'
                          )
                        )
                      )
                    )
                  )
              )
            );
          }),

          groups.length === 0 && React.createElement('div', { className: `${theme.cardBg} backdrop-blur border ${theme.border} rounded-lg shadow-md p-8 text-center` },
            React.createElement('h3', { className: `text-lg font-semibold ${theme.text} mb-2` }, 'No groups created'),
            React.createElement('p', { className: `${theme.textSecondary} mb-4` }, 'Create a group to organize your sensors'),
            React.createElement('button', {
              onClick: () => setShowAddGroupModal(true),
              className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium text-sm"
            }, '+ Create Group')
          )
        ),

        // Right: Unassigned sensors
        React.createElement('div', { className: "lg:col-span-1" },
          React.createElement('div', {
            className: `${theme.cardBg} backdrop-blur border ${theme.border} rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
              dragOverGroup === null && draggedItem ? `ring-2 ${theme.dragHighlight}` : ''
            }`,
            onDragOver: (e) => handleDragOver(e, null),
            onDragLeave: handleDragLeave,
            onDrop: (e) => handleDrop(e, null)
          },
            React.createElement('div', { className: `${theme.sidebarBg} border-b ${theme.border} px-3 py-2` },
              React.createElement('h3', { className: `text-md font-bold ${theme.text}` }, 'Unassigned Sensors'),
              React.createElement('p', { className: `${theme.textSecondary} text-xs` }, 'Drag to organize into groups')
            ),
            
            React.createElement('div', { className: "p-3 max-h-80 overflow-y-auto" },
              ungroupedSensors.length === 0 ?
                React.createElement('div', { className: `text-center py-6 ${theme.textMuted} border-2 border-dashed ${theme.dashedBorder} rounded-md` },
                  'All sensors are',
                  React.createElement('br'),
                  'assigned to groups'
                ) :
                React.createElement('div', { className: "space-y-2" },
                  ...ungroupedSensors.map((sensor) =>
                    React.createElement('div', {
                      key: sensor.id,
                      draggable: true,
                      onDragStart: (e) => handleDragStart(e, sensor),
                      className: `${theme.sensorBg} border ${theme.sensorBorder} rounded-md p-2 cursor-move transition-all duration-300 hover:shadow-md ${
                        sensor.isOnline 
                          ? sensor.isOccupied 
                            ? 'border-l-4 border-l-red-500' 
                            : 'border-l-4 border-l-green-500'
                          : 'border-l-4 border-l-gray-500'
                      }`
                    },
                      React.createElement('div', { className: "flex justify-between items-start mb-1" },
                        React.createElement('div', { className: "flex-1" },
                          React.createElement('h4', { className: `text-xs font-semibold ${theme.text} mb-1` }, sensor.name),
                          React.createElement('p', { className: `${theme.textMuted} text-xs` }, sensor.uuid)
                        ),
                        React.createElement('div', { className: "flex gap-1" },
                          React.createElement('button', {
                            onClick: () => startEdit(sensor),
                            className: `px-1 py-0.5 ${theme.textSecondary} hover:${theme.text} hover:bg-gray-500/20 rounded text-xs transition-colors duration-200`
                          }, 'Edit'),
                          React.createElement('button', {
                            onClick: () => deleteSensor(sensor.id),
                            className: `px-1 py-0.5 ${theme.textSecondary} hover:text-red-500 hover:bg-red-500/20 rounded text-xs transition-colors duration-200`
                          }, 'Delete')
                        )
                      ),

                      React.createElement('div', { className: "flex flex-wrap gap-1 mb-1" },
                        React.createElement('div', { 
                          className: `px-1 py-0.5 rounded text-xs font-medium ${
                            sensor.isOnline 
                              ? isDarkMode
                                ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                                : 'bg-green-100 text-green-700 border border-green-300'
                              : isDarkMode
                                ? 'bg-red-600/20 text-red-300 border border-red-600/30'
                                : 'bg-red-100 text-red-700 border border-red-300'
                          }`
                        }, sensor.isOnline ? 'Online' : 'Offline'),
                        
                        sensor.isOnline && React.createElement('div', { 
                          className: `px-1 py-0.5 rounded text-xs font-medium ${
                            sensor.isOccupied 
                              ? isDarkMode
                                ? 'bg-red-600/20 text-red-300 border border-red-600/30'
                                : 'bg-red-100 text-red-700 border border-red-300'
                              : isDarkMode
                                ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                                : 'bg-green-100 text-green-700 border border-green-300'
                          }`
                        }, sensor.isOccupied ? 'Occupied' : 'Vacant')
                      )
                    )
                  )
                )
            )
          )
        )
      ),

      // Create Group Modal
      showAddGroupModal && React.createElement('div', { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" },
        React.createElement('div', { className: `${theme.modalBg} border ${theme.modalBorder} rounded-lg shadow-xl w-full max-w-md` },
          React.createElement('div', { className: "p-4" },
            React.createElement('h2', { className: `text-lg font-semibold ${theme.text} mb-4` }, 'Create New Group'),
            
            React.createElement('div', { className: "space-y-3" },
              React.createElement('div', {},
                React.createElement('label', { className: `block ${theme.text} font-medium mb-1 text-sm` }, 'Group Name'),
                React.createElement('input', {
                  type: "text",
                  value: newGroup.name,
                  onChange: (e) => setNewGroup({...newGroup, name: e.target.value}),
                  className: `w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-md ${theme.text} placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm`,
                  placeholder: "e.g. Conference Room A"
                })
              ),
              
              React.createElement('div', {},
                React.createElement('label', { className: `block ${theme.text} font-medium mb-1 text-sm` }, 'Description (Optional)'),
                React.createElement('input', {
                  type: "text",
                  value: newGroup.description,
                  onChange: (e) => setNewGroup({...newGroup, description: e.target.value}),
                  className: `w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-md ${theme.text} placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm`,
                  placeholder: "e.g. 2nd floor east wing"
                })
              )
            ),
            
            React.createElement('div', { className: "flex gap-2 mt-4" },
              React.createElement('button', {
                onClick: () => setShowAddGroupModal(false),
                className: `flex-1 px-3 py-2 ${theme.textSecondary} ${theme.buttonSecondary} rounded-md transition-colors duration-200 text-sm`
              }, 'Cancel'),
              React.createElement('button', {
                onClick: addGroup,
                className: "flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200 font-medium text-sm"
              }, 'Create')
            )
          )
        )
      ),

      // Add Sensor Modal
      showAddModal && React.createElement('div', { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" },
        React.createElement('div', { className: `${theme.modalBg} border ${theme.modalBorder} rounded-lg shadow-xl w-full max-w-md` },
          React.createElement('div', { className: "p-4" },
            React.createElement('h2', { className: `text-lg font-semibold ${theme.text} mb-4` }, 'Add New Sensor'),
            
            React.createElement('div', { className: "space-y-3" },
              React.createElement('div', {},
                React.createElement('label', { className: `block ${theme.text} font-medium mb-1 text-sm` }, 'Sensor UUID (7 digits)'),
                React.createElement('input', {
                  type: "text",
                  value: newSensor.uuid,
                  onChange: (e) => setNewSensor({...newSensor, uuid: e.target.value.slice(0, 7)}),
                  className: `w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-md ${theme.text} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm`,
                  placeholder: "e.g. ABC1234",
                  maxLength: "7"
                })
              ),
              
              React.createElement('div', {},
                React.createElement('label', { className: `block ${theme.text} font-medium mb-1 text-sm` }, 'Sensor Name'),
                React.createElement('input', {
                  type: "text",
                  value: newSensor.name,
                  onChange: (e) => setNewSensor({...newSensor, name: e.target.value}),
                  className: `w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-md ${theme.text} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm`,
                  placeholder: "e.g. Sensor 01"
                })
              )
            ),
            
            React.createElement('div', { 
              className: `${isDarkMode ? 'bg-slate-600/30 border-slate-500/30' : 'bg-gray-100 border-gray-200'} border rounded-md p-3 mt-3`
            },
              React.createElement('p', { className: `${theme.textSecondary} text-sm` },
                'Sensors are initially added to the "Unassigned" area. You can drag and drop them into groups.'
              )
            ),
            
            React.createElement('div', { className: "flex gap-2 mt-4" },
              React.createElement('button', {
                onClick: () => setShowAddModal(false),
                className: `flex-1 px-3 py-2 ${theme.textSecondary} ${theme.buttonSecondary} rounded-md transition-colors duration-200 text-sm`
              }, 'Cancel'),
              React.createElement('button', {
                onClick: addSensor,
                className: "flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium text-sm"
              }, 'Add')
            )
          )
        )
      ),

      // Edit Sensor Modal
      showEditModal && editingSensor && React.createElement('div', { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" },
        React.createElement('div', { className: `${theme.modalBg} border ${theme.modalBorder} rounded-lg shadow-xl w-full max-w-md` },
          React.createElement('div', { className: "p-4" },
            React.createElement('h2', { className: `text-lg font-semibold ${theme.text} mb-4` }, 'Edit Sensor Settings'),
            
            React.createElement('div', { className: "space-y-3" },
              React.createElement('div', {},
                React.createElement('label', { className: `block ${theme.text} font-medium mb-1 text-sm` }, 'Sensor UUID (7 digits)'),
                React.createElement('input', {
                  type: "text",
                  value: editingSensor.uuid,
                  onChange: (e) => setEditingSensor({...editingSensor, uuid: e.target.value.slice(0, 7)}),
                  className: `w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-md ${theme.text} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm`,
                  maxLength: "7"
                })
              ),
              
              React.createElement('div', {},
                React.createElement('label', { className: `block ${theme.text} font-medium mb-1 text-sm` }, 'Sensor Name'),
                React.createElement('input', {
                  type: "text",
                  value: editingSensor.name,
                  onChange: (e) => setEditingSensor({...editingSensor, name: e.target.value}),
                  className: `w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-md ${theme.text} placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm`
                })
              )
            ),
            
            React.createElement('div', { className: "flex gap-2 mt-4" },
              React.createElement('button', {
                onClick: () => setShowEditModal(false),
                className: `flex-1 px-3 py-2 ${theme.textSecondary} ${theme.buttonSecondary} rounded-md transition-colors duration-200 text-sm`
              }, 'Cancel'),
              React.createElement('button', {
                onClick: saveEdit,
                className: "flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium text-sm"
              }, 'Save')
            )
          )
        )
      )
    )
  );
};

// Render the application
ReactDOM.render(React.createElement(RoomOccupancySystem), document.getElementById('root'));