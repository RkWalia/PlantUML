import { X } from 'lucide-react'

const TEMPLATES = {
  'Sequence Diagram': `@startuml
Alice -> Bob: Authentication Request
Bob -> Alice: Authentication Response

Alice -> Bob: Another authentication Request
Alice <-- Bob: Another authentication Response
@enduml`,

  'Class Diagram': `@startuml
class Animal {
  +String name
  +int age
  +void eat()
  +void sleep()
}

class Dog {
  +String breed
  +void bark()
}

class Cat {
  +String color
  +void meow()
}

Animal <|-- Dog
Animal <|-- Cat
@enduml`,

  'Use Case Diagram': `@startuml
left to right direction
skinparam packageStyle rectangle
actor Customer
actor Clerk
rectangle Checkout {
  Customer -- (Checkout)
  (Checkout) .> (Payment) : include
  (Help) .> (Checkout) : extends
  (Checkout) -- Clerk
}
@enduml`,

  'Activity Diagram': `@startuml
start
:Read data;
if (data available?) then (yes)
  :Process data;
else (no)
  :Wait for data;
endif
:Generate report;
stop
@enduml`,

  'Component Diagram': `@startuml
package "Frontend" {
  [Web Browser] as WB
  [Mobile App] as MA
}

package "Backend" {
  [API Gateway] as AG
  [User Service] as US
  [Database] as DB
}

WB --> AG
MA --> AG
AG --> US
US --> DB
@enduml`,

  'Mind Map': `@startmindmap
* PlantUML
** Diagrams
*** Sequence
*** Class
*** Use Case
*** Activity
** Features
*** Text-based
*** Version Control
*** Easy to maintain
@endmindmap`,

  'Gantt Chart': `@startgantt
project starts the 2024-01-01
[Task 1] lasts 10 days
[Task 2] lasts 5 days
[Task 2] starts at [Task 1]'s end
[Task 3] lasts 8 days
[Task 3] starts at [Task 2]'s end
@endgantt`
}

function ExampleTemplates({ onSelectTemplate, onClose }) {
  return (
    <div className="examples-overlay">
      <div className="examples-modal">
        <div className="examples-header">
          <h3>Choose a Template</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="examples-grid">
          {Object.entries(TEMPLATES).map(([name, code]) => (
            <div key={name} className="example-card" onClick={() => onSelectTemplate(code)}>
              <h4>{name}</h4>
              <pre className="example-preview">{code.slice(0, 100)}...</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExampleTemplates