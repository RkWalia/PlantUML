// Enhanced Frontend-only PlantUML renderer with support for all major diagram types
class PlantUMLRenderer {
  static async render(plantumlCode) {
    try {
      return this.parseAndRender(plantumlCode)
    } catch (error) {
      throw new Error(`Failed to render PlantUML: ${error.message}`)
    }
  }

  static parseAndRender(code) {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line)
    const diagramType = this.detectDiagramType(lines)
    
    console.log('Detected diagram type:', diagramType)
    console.log('Lines:', lines)
    
    switch (diagramType) {
      case 'sequence':
        return this.renderSequenceDiagram(lines)
      case 'class':
        return this.renderClassDiagram(lines)
      case 'usecase':
        return this.renderUseCaseDiagram(lines)
      case 'activity':
        return this.renderActivityDiagram(lines)
      case 'component':
        return this.renderComponentDiagram(lines)
      case 'mindmap':
        return this.renderMindMap(lines)
      case 'gantt':
        return this.renderGanttChart(lines)
      default:
        return this.renderGenericDiagram(lines)
    }
  }

  static detectDiagramType(lines) {
    const codeStr = lines.join(' ').toLowerCase()
    
    console.log('Code string for detection:', codeStr)
    
    // Check for specific diagram markers first
    if (codeStr.includes('@startmindmap') || codeStr.includes('@endmindmap')) {
      return 'mindmap'
    }
    if (codeStr.includes('@startgantt') || codeStr.includes('@endgantt')) {
      return 'gantt'
    }
    
    // Check for component diagrams BEFORE sequence diagrams
    // Component diagrams have packages and components in brackets
    if (codeStr.includes('package') && (codeStr.includes('[') && codeStr.includes(']'))) {
      return 'component'
    }
    
    // Check for class diagrams
    if (codeStr.includes('class ') || codeStr.includes('<|--') || codeStr.includes('--|>')) {
      return 'class'
    }
    
    // Check for use case diagrams
    if (codeStr.includes('actor') || codeStr.includes('usecase') || codeStr.includes('rectangle')) {
      return 'usecase'
    }
    
    // Check for activity diagrams
    if ((codeStr.includes('start') && codeStr.includes('stop')) || codeStr.includes('if (') || codeStr.includes('endif')) {
      return 'activity'
    }
    
    // Check for sequence diagrams LAST (since they also use arrows)
    if (codeStr.includes('->') || codeStr.includes('<-') || codeStr.includes('participant')) {
      return 'sequence'
    }
    
    return 'generic'
  }

  static renderSequenceDiagram(lines) {
    const participants = new Set()
    const interactions = []
    
    lines.forEach(line => {
      if (line.startsWith('@') || !line) return
      
      const arrowMatch = line.match(/(\w+)\s*(->|<-|-->|<--)\s*(\w+)\s*:\s*(.+)/)
      if (arrowMatch) {
        const [, from, arrow, to, message] = arrowMatch
        participants.add(from)
        participants.add(to)
        interactions.push({ from, to, message, arrow })
      }
    })

    const participantList = Array.from(participants)
    const width = Math.max(600, participantList.length * 150)
    const height = 200 + interactions.length * 60

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
    `

    // Draw participants
    participantList.forEach((participant, i) => {
      const x = 100 + i * 150
      svg += `
        <rect x="${x - 40}" y="20" width="80" height="40" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="5"/>
        <text x="${x}" y="45" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">${participant}</text>
        <line x1="${x}" y1="60" x2="${x}" y2="${height - 20}" stroke="#ddd" stroke-width="2" stroke-dasharray="5,5"/>
      `
    })

    // Draw interactions
    interactions.forEach((interaction, i) => {
      const fromIndex = participantList.indexOf(interaction.from)
      const toIndex = participantList.indexOf(interaction.to)
      const fromX = 100 + fromIndex * 150
      const toX = 100 + toIndex * 150
      const y = 100 + i * 60

      const isRightArrow = interaction.arrow.includes('->')
      const isDashed = interaction.arrow.includes('--')

      svg += `
        <line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" 
              stroke="#333" stroke-width="2" 
              ${isDashed ? 'stroke-dasharray="5,5"' : ''}
              ${isRightArrow ? 'marker-end="url(#arrowhead)"' : 'marker-start="url(#arrowhead)"'}/>
        <text x="${(fromX + toX) / 2}" y="${y - 10}" text-anchor="middle" 
              font-family="Arial" font-size="12">${interaction.message}</text>
      `
    })

    svg += '</svg>'
    return svg
  }

  static renderClassDiagram(lines) {
    const classes = []
    const relationships = []
    let currentClass = null

    lines.forEach(line => {
      if (line.startsWith('@') || !line) return

      const classMatch = line.match(/class\s+(\w+)\s*{?/)
      if (classMatch) {
        currentClass = {
          name: classMatch[1],
          attributes: [],
          methods: []
        }
        classes.push(currentClass)
        return
      }

      if (line === '}') {
        currentClass = null
        return
      }

      if (currentClass) {
        if (line.includes('(') && line.includes(')')) {
          currentClass.methods.push(line)
        } else if (line.trim() && !line.includes('class')) {
          currentClass.attributes.push(line)
        }
      }

      const relationMatch = line.match(/(\w+)\s*(<\|--|--\|>|<--|-->)\s*(\w+)/)
      if (relationMatch) {
        const [, from, relation, to] = relationMatch
        relationships.push({ from, to, relation })
      }
    })

    const width = Math.max(800, classes.length * 250)
    const height = 400 + Math.max(0, classes.length - 2) * 100

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="inheritance" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
          <polygon points="0 6, 10 0, 10 12" fill="white" stroke="#333" stroke-width="1" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
    `

    // Draw classes
    classes.forEach((cls, i) => {
      const x = 50 + i * 250
      const y = 50
      const classHeight = 80 + (cls.attributes.length + cls.methods.length) * 20

      svg += `
        <rect x="${x}" y="${y}" width="200" height="${classHeight}" fill="#fff3e0" stroke="#f57c00" stroke-width="2"/>
        <rect x="${x}" y="${y}" width="200" height="30" fill="#f57c00"/>
        <text x="${x + 100}" y="${y + 20}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">${cls.name}</text>
      `

      let textY = y + 50
      cls.attributes.forEach(attr => {
        svg += `<text x="${x + 10}" y="${textY}" font-family="Arial" font-size="12">${attr}</text>`
        textY += 20
      })

      if (cls.attributes.length > 0 && cls.methods.length > 0) {
        svg += `<line x1="${x}" y1="${textY}" x2="${x + 200}" y2="${textY}" stroke="#f57c00" stroke-width="1"/>`
        textY += 10
      }

      cls.methods.forEach(method => {
        svg += `<text x="${x + 10}" y="${textY}" font-family="Arial" font-size="12">${method}</text>`
        textY += 20
      })
    })

    // Draw relationships
    relationships.forEach(rel => {
      const fromClass = classes.find(c => c.name === rel.from)
      const toClass = classes.find(c => c.name === rel.to)
      if (fromClass && toClass) {
        const fromIndex = classes.indexOf(fromClass)
        const toIndex = classes.indexOf(toClass)
        const fromX = 150 + fromIndex * 250
        const toX = 150 + toIndex * 250
        const fromY = 150
        const toY = 150

        svg += `
          <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" 
                stroke="#333" stroke-width="2" marker-end="url(#inheritance)"/>
        `
      }
    })

    svg += '</svg>'
    return svg
  }

  static renderUseCaseDiagram(lines) {
    const actors = []
    const usecases = []
    const relationships = []

    lines.forEach(line => {
      if (line.startsWith('@') || !line) return

      const actorMatch = line.match(/actor\s+(\w+)/)
      if (actorMatch) {
        actors.push(actorMatch[1])
        return
      }

      const usecaseMatch = line.match(/\(([^)]+)\)/)
      if (usecaseMatch) {
        usecases.push(usecaseMatch[1])
        return
      }

      const relationMatch = line.match(/(\w+)\s*--\s*\(([^)]+)\)/)
      if (relationMatch) {
        relationships.push({ actor: relationMatch[1], usecase: relationMatch[2] })
      }
    })

    const width = 800
    const height = 600

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
    `

    // Draw actors
    actors.forEach((actor, i) => {
      const x = 100
      const y = 100 + i * 100
      svg += `
        <g>
          <circle cx="${x}" cy="${y}" r="15" fill="#ffeb3b" stroke="#f57f17" stroke-width="2"/>
          <line x1="${x}" y1="${y + 15}" x2="${x}" y2="${y + 45}" stroke="#333" stroke-width="2"/>
          <line x1="${x - 15}" y1="${y + 25}" x2="${x + 15}" y2="${y + 25}" stroke="#333" stroke-width="2"/>
          <line x1="${x}" y1="${y + 45}" x2="${x - 10}" y2="${y + 65}" stroke="#333" stroke-width="2"/>
          <line x1="${x}" y1="${y + 45}" x2="${x + 10}" y2="${y + 65}" stroke="#333" stroke-width="2"/>
          <text x="${x}" y="${y + 85}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">${actor}</text>
        </g>
      `
    })

    // Draw use cases
    usecases.forEach((usecase, i) => {
      const x = 400
      const y = 100 + i * 80
      svg += `
        <ellipse cx="${x}" cy="${y}" rx="80" ry="30" fill="#e8f5e8" stroke="#4caf50" stroke-width="2"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Arial" font-size="12">${usecase}</text>
      `
    })

    // Draw relationships
    relationships.forEach(rel => {
      const actorIndex = actors.indexOf(rel.actor)
      const usecaseIndex = usecases.indexOf(rel.usecase)
      if (actorIndex >= 0 && usecaseIndex >= 0) {
        const actorX = 115
        const actorY = 100 + actorIndex * 100
        const usecaseX = 320
        const usecaseY = 100 + usecaseIndex * 80

        svg += `
          <line x1="${actorX}" y1="${actorY}" x2="${usecaseX}" y2="${usecaseY}" 
                stroke="#333" stroke-width="2"/>
        `
      }
    })

    svg += '</svg>'
    return svg
  }

  static renderActivityDiagram(lines) {
    const activities = []
    const decisions = []
    let hasStart = false
    let hasStop = false

    lines.forEach(line => {
      if (line.startsWith('@') || !line) return

      if (line.includes('start')) {
        hasStart = true
      } else if (line.includes('stop')) {
        hasStop = true
      } else if (line.includes('if (') && line.includes(')')) {
        const condition = line.match(/if \(([^)]+)\)/)?.[1] || 'condition'
        decisions.push(condition)
      } else if (line.startsWith(':') && line.endsWith(';')) {
        activities.push(line.slice(1, -1))
      }
    })

    const width = 400
    const height = 100 + (activities.length + decisions.length) * 80 + (hasStart ? 50 : 0) + (hasStop ? 50 : 0)

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
    `

    let currentY = 50

    // Start node
    if (hasStart) {
      svg += `
        <circle cx="200" cy="${currentY}" r="15" fill="#4caf50" stroke="#2e7d32" stroke-width="2"/>
        <text x="200" y="${currentY + 5}" text-anchor="middle" font-family="Arial" font-size="10" fill="white">START</text>
      `
      currentY += 60
    }

    // Activities and decisions
    [...activities, ...decisions].forEach((item, i) => {
      const isDecision = decisions.includes(item)
      
      if (isDecision) {
        // Diamond for decision
        svg += `
          <polygon points="200,${currentY - 20} 240,${currentY} 200,${currentY + 20} 160,${currentY}" 
                   fill="#fff3e0" stroke="#ff9800" stroke-width="2"/>
          <text x="200" y="${currentY + 5}" text-anchor="middle" font-family="Arial" font-size="10">${item}</text>
        `
      } else {
        // Rectangle for activity
        svg += `
          <rect x="120" y="${currentY - 20}" width="160" height="40" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" rx="5"/>
          <text x="200" y="${currentY + 5}" text-anchor="middle" font-family="Arial" font-size="12">${item}</text>
        `
      }

      // Arrow to next item
      if (i < activities.length + decisions.length - 1 || hasStop) {
        svg += `
          <line x1="200" y1="${currentY + 20}" x2="200" y2="${currentY + 40}" 
                stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
        `
      }

      currentY += 80
    })

    // Stop node
    if (hasStop) {
      svg += `
        <circle cx="200" cy="${currentY}" r="15" fill="#f44336" stroke="#c62828" stroke-width="2"/>
        <text x="200" y="${currentY + 5}" text-anchor="middle" font-family="Arial" font-size="10" fill="white">STOP</text>
      `
    }

    svg += '</svg>'
    return svg
  }

  static renderComponentDiagram(lines) {
    console.log('Rendering component diagram with lines:', lines)
    
    const components = new Map() // Map to store component name -> alias mapping
    const packages = []
    const connections = []
    let currentPackage = null

    lines.forEach(line => {
      if (line.startsWith('@') || !line) return
      
      console.log('Processing line:', line)

      // Handle closing braces
      if (line === '}') {
        currentPackage = null
        return
      }

      // Parse package declarations
      const packageMatch = line.match(/package\s+"([^"]+)"\s*{?/)
      if (packageMatch) {
        currentPackage = packageMatch[1]
        packages.push({ name: currentPackage, components: [] })
        console.log('Found package:', currentPackage)
        return
      }

      // Parse component declarations with optional aliases
      const componentMatch = line.match(/\[([^\]]+)\](?:\s+as\s+(\w+))?/)
      if (componentMatch) {
        const componentName = componentMatch[1]
        const alias = componentMatch[2] || componentName
        
        console.log('Found component:', componentName, 'with alias:', alias)
        
        // Store the mapping
        components.set(alias, componentName)
        components.set(componentName, componentName) // Also map full name to itself
        
        // Add to current package if we're inside one
        if (currentPackage) {
          const pkg = packages.find(p => p.name === currentPackage)
          if (pkg) {
            pkg.components.push({ name: componentName, alias })
          }
        } else {
          // Standalone component
          packages.push({ name: null, components: [{ name: componentName, alias }] })
        }
        return
      }

      // Parse connections - handle both aliases and full names
      const connectionMatch = line.match(/(\w+|\[[^\]]+\])\s*(-->|->|--)\s*(\w+|\[[^\]]+\])/)
      if (connectionMatch) {
        let from = connectionMatch[1].replace(/[\[\]]/g, '') // Remove brackets if present
        let to = connectionMatch[3].replace(/[\[\]]/g, '')
        
        console.log('Found connection:', from, '->', to)
        
        connections.push({ 
          from: from, 
          to: to,
          fromAlias: from,
          toAlias: to
        })
      }
    })

    console.log('Final packages:', packages)
    console.log('Final components map:', components)
    console.log('Final connections:', connections)

    const width = Math.max(800, packages.length * 350)
    const height = 600

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
    `

    const componentPositions = new Map()

    // Draw packages and components
    packages.forEach((pkg, pkgIndex) => {
      if (pkg.name) {
        // Draw package container
        const pkgX = 50 + pkgIndex * 350
        const pkgY = 50
        const pkgWidth = 300
        const pkgHeight = 200

        svg += `
          <rect x="${pkgX}" y="${pkgY}" width="${pkgWidth}" height="${pkgHeight}" 
                fill="#f3e5f5" stroke="#9c27b0" stroke-width="2" stroke-dasharray="5,5" rx="10"/>
          <text x="${pkgX + 10}" y="${pkgY + 25}" font-family="Arial" font-size="16" font-weight="bold" fill="#9c27b0">${pkg.name}</text>
        `

        // Draw components inside package
        pkg.components.forEach((comp, compIndex) => {
          const compX = pkgX + 20 + (compIndex % 2) * 130
          const compY = pkgY + 50 + Math.floor(compIndex / 2) * 70
          
          componentPositions.set(comp.alias, { x: compX + 60, y: compY + 25 })
          componentPositions.set(comp.name, { x: compX + 60, y: compY + 25 })

          svg += `
            <rect x="${compX}" y="${compY}" width="120" height="50" 
                  fill="#e8f5e8" stroke="#4caf50" stroke-width="2" rx="5"/>
            <text x="${compX + 60}" y="${compY + 30}" text-anchor="middle" 
                  font-family="Arial" font-size="11" font-weight="bold">${comp.name}</text>
          `
        })
      } else {
        // Standalone components
        pkg.components.forEach((comp, compIndex) => {
          const compX = 50 + compIndex * 150
          const compY = 300
          
          componentPositions.set(comp.alias, { x: compX + 60, y: compY + 25 })
          componentPositions.set(comp.name, { x: compX + 60, y: compY + 25 })

          svg += `
            <rect x="${compX}" y="${compY}" width="120" height="50" 
                  fill="#e3f2fd" stroke="#2196f3" stroke-width="2" rx="5"/>
            <text x="${compX + 60}" y="${compY + 30}" text-anchor="middle" 
                  font-family="Arial" font-size="11" font-weight="bold">${comp.name}</text>
          `
        })
      }
    })

    console.log('Component positions:', componentPositions)

    // Draw connections
    connections.forEach(conn => {
      const fromPos = componentPositions.get(conn.fromAlias) || componentPositions.get(conn.from)
      const toPos = componentPositions.get(conn.toAlias) || componentPositions.get(conn.to)
      
      console.log('Drawing connection from', conn.from, 'to', conn.to)
      console.log('From position:', fromPos, 'To position:', toPos)
      
      if (fromPos && toPos) {
        svg += `
          <line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" 
                stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
        `
      }
    })

    svg += '</svg>'
    return svg
  }

  static renderMindMap(lines) {
    const nodes = []
    let currentLevel = 0

    lines.forEach(line => {
      if (line.startsWith('@') || !line) return

      const levelMatch = line.match(/^(\*+)\s*(.+)/)
      if (levelMatch) {
        const level = levelMatch[1].length
        const text = levelMatch[2]
        nodes.push({ level, text })
      }
    })

    const width = 800
    const height = 600

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
    `

    // Draw mind map nodes
    nodes.forEach((node, i) => {
      const x = 100 + node.level * 150
      const y = 100 + i * 60
      const colors = ['#ff9800', '#2196f3', '#4caf50', '#e91e63', '#9c27b0']
      const color = colors[node.level % colors.length]

      svg += `
        <ellipse cx="${x}" cy="${y}" rx="${60 + node.level * 10}" ry="25" fill="${color}20" stroke="${color}" stroke-width="2"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">${node.text}</text>
      `

      // Draw connection to parent
      if (node.level > 1 && i > 0) {
        const parentIndex = nodes.slice(0, i).reverse().findIndex(n => n.level === node.level - 1)
        if (parentIndex >= 0) {
          const parentY = 100 + (i - parentIndex - 1) * 60
          const parentX = 100 + (node.level - 1) * 150
          svg += `
            <line x1="${parentX + 60}" y1="${parentY}" x2="${x - 60}" y2="${y}" 
                  stroke="#666" stroke-width="2"/>
          `
        }
      }
    })

    svg += '</svg>'
    return svg
  }

  static renderGanttChart(lines) {
    const tasks = []
    let projectStart = null

    lines.forEach(line => {
      if (line.startsWith('@') || !line) return

      const projectMatch = line.match(/project starts the (.+)/)
      if (projectMatch) {
        projectStart = projectMatch[1]
        return
      }

      const taskMatch = line.match(/\[([^\]]+)\]\s+lasts\s+(\d+)\s+days?/)
      if (taskMatch) {
        tasks.push({ name: taskMatch[1], duration: parseInt(taskMatch[2]) })
      }
    })

    const width = 800
    const height = 100 + tasks.length * 50

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
      <text x="400" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">Gantt Chart</text>
    `

    if (projectStart) {
      svg += `<text x="50" y="50" font-family="Arial" font-size="12">Start: ${projectStart}</text>`
    }

    // Draw tasks
    let currentStart = 0
    tasks.forEach((task, i) => {
      const y = 80 + i * 50
      const barWidth = task.duration * 20
      const x = 200

      svg += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="30" fill="#4caf50" stroke="#2e7d32" stroke-width="1"/>
        <text x="50" y="${y + 20}" font-family="Arial" font-size="12">${task.name}</text>
        <text x="${x + barWidth + 10}" y="${y + 20}" font-family="Arial" font-size="10">${task.duration} days</text>
      `

      currentStart += task.duration
    })

    svg += '</svg>'
    return svg
  }

  static renderGenericDiagram(lines) {
    const width = 600
    const height = 400

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="1"/>
      <rect x="50" y="50" width="500" height="300" fill="#f5f5f5" stroke="#999" stroke-width="2" rx="10"/>
      <text x="300" y="150" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">PlantUML Diagram</text>
      <text x="300" y="180" text-anchor="middle" font-family="Arial" font-size="14">Parsed from your code</text>
      <text x="300" y="220" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
        ${lines.length} lines of PlantUML code detected
      </text>
    `

    svg += '</svg>'
    return svg
  }
}

export default PlantUMLRenderer
