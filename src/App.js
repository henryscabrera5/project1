import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Download, Globe, Ruler, FileText, X, DollarSign, CalendarDays, Link, TrendingUp, Wrench, Users } from 'lucide-react'; // Added Users icon for subcontractors
import { Analytics } from "@vercel/analytics/react"

// Reusable MultiSelectDropdown component for better selection experience
const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(id => id !== value)
      : [...selectedValues, value];
    onChange(newSelection);
  };

  const selectedNames = options
    .filter(option => selectedValues.includes(option.id))
    .map(option => option.name)
    .join(', ');

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedNames || placeholder}
        <span className="ml-2 text-gray-500"></span>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-3 text-gray-500">{placeholder}</div>
          ) : (
            options.map(option => (
              <label key={option.id} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                />
                {option.name}
                {option.description && <span className="text-xs text-gray-500 ml-2">({option.description})</span>}
                {option.startDate && option.endDate && <span className="text-xs text-gray-500 ml-2">({option.startDate} - {option.endDate})</span>}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};


const ConstructionCalculator = () => {
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('imperial');
  const [selectedCurrency, setSelectedCurrency] = useState({ code: 'USD', symbol: '$', name: 'US Dollar' });
  const [materials, setMaterials] = useState([]);
  const [laborTrades, setLaborTrades] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]); // New state for subcontractors
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'scheduling', 'cost-forecast', 'subcontractors'

  // State for unit converters
  const [ftInValue, setFtInValue] = useState('');
  const [ftInUnit, setFtInUnit] = useState('in');
  const [ftInOutput, setFtInOutput] = useState('');

  const [mCmValue, setMCmValue] = useState('');
  const [mCmUnit, setMCmUnit] = useState('cm');
  const [mCmOutput, setMCmOutput] = useState('');

  // Form state for adding new materials
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    type: 'area',
    lengthFt: '',
    widthFt: '',
    heightFt: '',
    lengthM: '',
    widthM: '',
    heightM: '',
    quantity: '',
    costPerUnit: '',
    wastePercentage: 10,
    beamLengthFt: '',
    beamWidthFt: '',
    beamHeightFt: '',
    beamLengthM: '',
    beamWidthM: '',
    beamHeightM: '',
    totalSpanFt: '',
    totalSpanM: '',
    spacingFt: '',
    spacingM: '',
    materialLaborTrade: '',
    materialLaborRate: '',
    materialLaborHours: '',
    materialLaborNumberOfLaborers: 1,
    concreteCementBags: '',
    concreteCementCostPerBag: '',
    concreteSandQty: '',
    concreteSandUnit: 'cu yd',
    concreteSandCostPerUnit: '',
    concreteGravelQty: '',
    concreteGravelUnit: 'cu yd',
    concreteGravelCostPerUnit: '',
    concreteWaterQty: '',
    concreteWaterUnit: 'gal',
    concreteWaterCostPerUnit: '',
    concreteMixerRentalCost: '',
    concreteAncillaryCostName: '',
    concreteAncillaryCostValue: '',
    submittalLink: '',
    invoiceLink: '',
    subcontractorId: '', // New field for subcontractor assignment
  });

  // Form state for adding new project-level labor trades
  const [newLaborTrade, setNewLaborTrade] = useState({
    tradeName: '',
    rate: '',
    hours: '',
    numberOfLaborers: 1,
    subcontractorId: '', // New field for subcontractor assignment
  });

  // New state for adding new equipment
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    type: 'rental', // 'purchase' or 'rental'
    purchaseCost: '',
    usefulLifeYears: '',
    rentalRate: '',
    rentalUnit: 'day', // 'day', 'week', 'month', 'hour'
    numberOfDays: '',
    numberOfHours: '',
    equipmentLaborTrade: '',
    equipmentLaborRate: '',
    equipmentLaborHours: '',
    equipmentLaborNumberOfLaborers: 1,
    submittalLink: '',
    invoiceLink: '',
    subcontractorId: '', // New field for subcontractor assignment
  });

  // State for scheduling tab
  const [scheduleTasks, setScheduleTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    taskName: '',
    startDate: '',
    endDate: '',
    assignedMaterialIds: [],
    assignedEquipmentIds: [],
    subcontractorId: '', // New field for subcontractor assignment
  });

  // State for cost forecast tab
  const [forecastCosts, setForecastCosts] = useState([]);
  const [newForecastCost, setNewForecastCost] = useState({
    costName: '',
    costCategory: 'Material', // Default category
    amount: '',
    assignedTaskIds: [], // Array of schedule task IDs
  });

  // New state for adding new subcontractors
  const [newSubcontractor, setNewSubcontractor] = useState({
    name: '',
    company: '',
    contactInfo: '',
  });

  // Effect to clean up assigned materials in schedule if a material is removed
  useEffect(() => {
    const materialIds = new Set(materials.map(m => m.id));
    const updatedTasks = scheduleTasks.map(task => ({
      ...task,
      assignedMaterialIds: task.assignedMaterialIds.filter(id => materialIds.has(id))
    }));
    setScheduleTasks(updatedTasks);
  }, [materials]);

  // Effect to clean up assigned equipment in schedule if equipment is removed
  useEffect(() => {
    const equipmentIds = new Set(equipment.map(e => e.id));
    const updatedTasks = scheduleTasks.map(task => ({
      ...task,
      assignedEquipmentIds: task.assignedEquipmentIds.filter(id => equipmentIds.has(id))
    }));
    setScheduleTasks(updatedTasks);
  }, [equipment]);

  // Effect to clean up assigned tasks in forecast if a task is removed
  useEffect(() => {
    const taskIds = new Set(scheduleTasks.map(t => t.id));
    const updatedForecastCosts = forecastCosts.map(cost => ({
      ...cost,
      assignedTaskIds: cost.assignedTaskIds.filter(id => taskIds.has(id))
    }));
    setForecastCosts(updatedForecastCosts);
  }, [scheduleTasks]);

  // Effect to clean up subcontractor assignments if a subcontractor is removed
  useEffect(() => {
    const subcontractorIds = new Set(subcontractors.map(sc => sc.id));

    setMaterials(prevMaterials => prevMaterials.map(m => ({
      ...m,
      subcontractorId: subcontractorIds.has(m.subcontractorId) ? m.subcontractorId : '',
    })));

    setLaborTrades(prevLaborTrades => prevLaborTrades.map(lt => ({
      ...lt,
      subcontractorId: subcontractorIds.has(lt.subcontractorId) ? lt.subcontractorId : '',
    })));

    setEquipment(prevEquipment => prevEquipment.map(eq => ({
      ...eq,
      subcontractorId: subcontractorIds.has(eq.subcontractorId) ? eq.subcontractorId : '',
    })));

    setScheduleTasks(prevScheduleTasks => prevScheduleTasks.map(st => ({
      ...st,
      subcontractorId: subcontractorIds.has(st.subcontractorId) ? st.subcontractorId : '',
    })));
    console.log("[LOG] Subcontractor assignments cleaned up.");
  }, [subcontractors]);


  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    { code: 'CRC', symbol: '', name: 'Costa Rican Colón' },
    { code: 'CUP', symbol: '', name: 'Cuban Peso' },
    { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
    { code: 'ECU', symbol: '$', name: 'Ecuadorian Sucre (historical, USD used)' },
    { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' },
    { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
    { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
    { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
    { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
    { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
    { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol' },
    { code: 'PYG', symbol: '', name: 'Paraguayan Guarani' },
    { code: 'SRD', symbol: '$', name: 'Surinamese Dollar' },
    { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
    { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
    { code: 'VEF', symbol: 'Bs.F', name: 'Venezuelan Bolívar (historical)' },
  ].sort((a, b) => {
    if (a.code === 'USD') return -1;
    if (b.code === 'USD') return 1;
    if (a.code === 'EUR') return -1;
    if (b.code === 'EUR') return 1;
    if (a.code === 'GBP') return -1;
    if (b.code === 'GBP') return 1;
    if (a.code === 'CNY') return -1;
    if (b.code === 'CNY') return 1;
    return a.name.localeCompare(b.name);
  });


  const translations = {
    en: {
      title: 'Advanced Construction Cost Calculator',
      subtitle: 'Add multiple materials, equipment, and calculate comprehensive project costs',
      costCalculatorTab: 'Cost Calculator',
      schedulingTab: 'Scheduling',
      costForecastTab: 'Cost Forecast',
      subcontractorsTab: 'Subcontractors', // New
      addMaterial: 'Add New Material',
      materialName: 'Material Name',
      materialDescription: 'Description (Optional)',
      calculationType: 'Calculation Type',
      length: units === 'imperial' ? 'Length (ft)' : 'Length (m)',
      width: units === 'imperial' ? 'Width (ft)' : 'Width (m)',
      height: units === 'imperial' ? 'Height (ft)' : 'Height (m)',
      lengthFt: 'Length (ft)',
      widthFt: 'Width (ft)',
      heightFt: 'Height (ft)',
      lengthM: 'Length (m)',
      widthM: 'Width (m)',
      heightM: 'Height (m)',
      quantity: 'Quantity/Units',
      costPerUnit: `Cost per Unit (${selectedCurrency.symbol})`,
      costPerSqFt: `Cost per Sq Ft (${selectedCurrency.symbol})`,
      costPerSqM: `Cost per Sq M (${selectedCurrency.symbol})`,
      costPerLinearFt: `Cost per Linear Ft (${selectedCurrency.symbol})`,
      costPerLinearM: `Cost per Linear M (${selectedCurrency.symbol})`,
      costPerIndividualUnit: `Cost per Unit (${selectedCurrency.symbol})`,
      costPerBeam: `Cost per Beam (${selectedCurrency.symbol})`,
      wastePercentage: 'Waste %',
      submittalLink: 'Submittal Link (URL)',
      invoiceLink: 'Invoice/Proforma Link (URL)',
      addToList: 'Add to Materials List',
      materialsList: 'Materials List',
      laborDetails: 'Project Labor Details',
      tradeName: 'Trade Name',
      hourlyRate: `Hourly Rate (${selectedCurrency.symbol}/hr)`,
      totalHours: 'Total Hours',
      numberOfLaborers: 'Number of Laborers',
      addTrade: 'Add Project Labor Trade',
      laborCostBreakdown: 'Project Labor Cost Breakdown',
      materialSpecificLabor: 'Material-Specific Labor (Optional)',
      materialLaborTrade: 'Labor Trade',
      materialLaborRate: `Rate (${selectedCurrency.symbol}/hr)`,
      materialLaborHours: 'Hours',
      calculate: 'Calculate Total Project Cost',
      costSummary: 'Cost Summary',
      exportPDF: 'Export PDF',
      exportExcel: 'Export Excel',
      totalMaterialCost: 'Total Material Cost',
      totalProjectLaborCost: 'Total Project Labor Cost',
      totalEquipmentCost: 'Total Equipment Cost',
      grandTotal: 'Grand Total:',
      area: 'Area Coverage',
      linear: 'Linear Measurement',
      units: 'Individual Units',
      beams: 'Beams/Framing',
      concrete: 'Concrete Components',
      remove: 'Remove',
      edit: 'Edit',
      imperial: 'Imperial',
      metric: 'Metric',
      noMaterials: 'No materials added yet. Use the form above to add materials.',
      noLaborTrades: 'No project labor trades added yet. Use the form above to add trades.',
      noEquipment: 'No equipment added yet. Use the form above to add equipment.',
      fillRequired: 'Please fill in all required fields',
      currency: 'Currency',
      baseUnits: 'Base Units:',
      wasteAmount: 'Waste Amount:',
      totalUnitsWithWaste: 'Total Units (with waste):',
      totalCost: 'Total Cost:',
      materialLaborCost: 'Material Labor Cost:',
      types: {
        area: 'Area-based (e.g., flooring, paint, drywall, concrete, insulation)',
        linear: 'Linear-based (e.g., trim, piping)',
        units: 'Unit-based (e.g., toilets, fixtures, doors, water tanks, septic tanks)',
        beams: 'For structural beams, joists, studs (calculates total linear footage/number of beams)',
        concrete: 'Concrete components (cement, sand, gravel, water, mixer rental, ancillary costs)',
      },
      concreteCementBags: 'Cement Bags',
      concreteCementCostPerBag: `Cost per Bag (${selectedCurrency.symbol})`,
      concreteSandQty: 'Sand Quantity',
      concreteSandUnit: 'Sand Unit',
      concreteSandCostPerUnit: `Cost per Sand Unit (${selectedCurrency.symbol})`,
      concreteGravelQty: 'Gravel Quantity',
      concreteGravelUnit: 'Gravel Unit',
      concreteGravelCostPerUnit: `Cost per Gravel Unit (${selectedCurrency.symbol})`,
      concreteWaterQty: 'Water Quantity',
      concreteWaterUnit: 'Water Unit',
      concreteWaterCostPerUnit: `Cost per Water Unit (${selectedCurrency.symbol})`,
      concreteMixerRental: 'Mixer Rental Cost (Optional)',
      concreteAncillaryCost: 'Other Ancillary Concrete Cost (Optional)',
      concreteAncillaryCostName: 'Ancillary Cost Name',
      concreteAncillaryCostValue: `Ancillary Cost Value (${selectedCurrency.symbol})`,
      cuyd: 'cu yd',
      cum: 'm³',
      gal: 'gal',
      liter: 'L',
      batch: 'batch',
      concreteComponents: 'Concrete Components:',
      ft: 'ft',
      m: 'm',
      sqft: 'sq ft',
      sqm: 'm²',
      linft: 'lin ft',
      linm: 'lin m',
      cubicYards: 'cubic yards',
      cubicMeters: 'm³',
      totalBeams: 'Total Beams:',
      unitConverters: 'Unit Converters',
      feetToInches: 'Feet  Inches',
      metersToCentimeters: 'Meters  Centimeters',
      feet: 'Feet',
      meters: 'Meters',
      inches: 'Inches',
      centimeters: 'Centimeters',
      convert: 'Convert',
      inputUnit: 'Input Unit',
      outputUnit: 'Output Unit',
      calculatedArea: 'Calculated Area:',
      individualBeamLengthFt: 'Individual Beam Length (ft)',
      individualBeamWidthFt: 'Individual Beam Beam Width (ft) (Optional)',
      individualBeamHeightFt: 'Individual Beam Height (ft) (Optional)',
      individualBeamLengthM: 'Individual Beam Length (m)',
      individualBeamWidthM: 'Individual Beam Width (m) (Optional)',
      individualBeamHeightM: 'Individual Beam Height (m) (Optional)',
      totalSpan: 'Total Span',
      spacing: 'Spacing',
      // Placeholders
      ph_materialName: 'e.g., Drywall, Toilet, 2x4 Beam',
      ph_materialDescription: 'e.g., Fire-rated, White, 100 gallon capacity',
      ph_length: 'ft',
      ph_width: 'ft',
      ph_height: 'ft',
      ph_lengthM: 'm',
      ph_widthM: 'm',
      ph_heightM: 'm',
      ph_concreteCementBags: 'e.g., 10',
      ph_concreteCementCostPerBag: 'e.g., 5.50',
      ph_concreteSandQty: 'e.g., 0.5',
      ph_concreteSandCostPerUnit: 'e.g., 30',
      ph_concreteGravelQty: 'e.g., 1',
      ph_concreteGravelCostPerUnit: 'e.g., 40',
      ph_concreteWaterQty: 'e.g., 20',
      ph_concreteWaterCostPerUnit: 'e.g., 0.10',
      ph_concreteMixerRental: 'e.g., 150',
      ph_concreteAncillaryCostName: 'e.g., Rebar',
      ph_concreteAncillaryCostValue: 'e.g., 50',
      ph_materialLaborTrade: 'e.g., Installer',
      ph_materialLaborRate: '30',
      ph_materialLaborHours: '4',
      ph_laborTradeName: 'e.g., Carpenter',
      ph_laborHourlyRate: '45',
      ph_laborTotalHours: '8',
      ph_numberOfLaborers: '1',
      ph_ftInValue_in: 'e.g., 66',
      ph_ftInValue_ft: 'e.g., 5.5',
      ph_mCmValue_cm: 'e.g., 175',
      ph_mCmValue_m: 'e.g., 1.75',
      ph_submittalLink: 'e.g., https://example.com/drywall-submittal.pdf',
      ph_invoiceLink: 'e.g., https://example.com/toilet-invoice.pdf',
      // Scheduling translations
      scheduleTitle: 'Construction Schedule',
      addTask: 'Add New Task',
      taskName: 'Task Name',
      startDate: 'Start Date',
      endDate: 'End Date',
      assignedMaterials: 'Assigned Materials',
      assignedEquipment: 'Assigned Equipment',
      assignedSubcontractor: 'Assigned Subcontractor', // New
      assignMaterialsPlaceholder: 'Select materials for this task',
      assignEquipmentPlaceholder: 'Select equipment for this task',
      assignSubcontractorPlaceholder: 'Select a subcontractor for this task', // New
      addScheduleTask: 'Add Task to Schedule',
      noScheduleTasks: 'No tasks added yet. Use the form above to create a schedule.',
      exportSchedule: 'Export Schedule', // Modified
      scheduleExpectedFormat: 'Expected JSON format: [{ "taskName": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "assignedMaterialIds": [material_id_1, material_id_2] }]',
      viewSubmittal: 'View Submittal',
      viewInvoice: 'View Invoice',
      // Cost Forecast translations
      costForecastTitle: 'Construction Project Cost Forecast',
      addForecastCost: 'Add New Forecast Cost',
      costCategory: 'Cost Category',
      amount: 'Amount',
      land: 'Land',
      material: 'Material',
      labor: 'Labor',
      equipment: 'Equipment',
      other: 'Other',
      assignedTasks: 'Assigned Schedule Tasks',
      assignTasksPlaceholder: 'Select tasks for this cost',
      addForecastItem: 'Add Forecast Item',
      noForecastCosts: 'No forecast costs added yet. Use the form above to add cost items.',
      totalForecastCostByCategory: 'Total Forecast Cost by Category',
      totalLandCost: 'Total Land Cost:',
      totalMaterialForecastCost: 'Total Material Forecast Cost:',
      totalLaborForecastCost: 'Total Labor Forecast Cost:',
      totalEquipmentForecastCost: 'Total Equipment Forecast Cost:',
      totalOtherCost: 'Total Other Cost:',
      grandTotalForecast: 'Grand Total Forecast:',
      ph_costName: 'e.g., Land Acquisition, Permit Fees',
      ph_amount: 'e.g., 50000',
      // Equipment translations
      addEquipment: 'Add New Equipment',
      equipmentName: 'Equipment Name',
      equipmentDescription: 'Description (Optional)',
      equipmentType: 'Equipment Type',
      purchase: 'Purchase',
      rental: 'Rental',
      purchaseCost: `Purchase Cost (${selectedCurrency.symbol})`,
      usefulLifeYears: 'Useful Life (Years, Optional)',
      rentalRate: `Rental Rate (${selectedCurrency.symbol})`,
      rentalUnit: 'Rental Unit',
      numberOfDays: 'Number of Days',
      numberOfHours: 'Number of Hours (per day)',
      day: 'Day',
      week: 'Week',
      month: 'Month',
      hour: 'Hour',
      equipmentSpecificLabor: 'Equipment-Specific Labor (Optional)',
      equipmentLaborTrade: 'Labor Trade',
      equipmentLaborRate: `Rate (${selectedCurrency.symbol}/hr)`,
      equipmentLaborHours: 'Hours',
      ph_equipmentName: 'e.g., Excavator, Scaffolding, Drill',
      ph_equipmentDescription: 'e.g., Heavy-duty, 20ft, Cordless',
      ph_purchaseCost: 'e.g., 75000',
      ph_usefulLifeYears: 'e.g., 10',
      ph_rentalRate: 'e.g., 300',
      ph_numberOfDays: 'e.g., 5',
      ph_numberOfHours: 'e.g., 8',
      ph_equipmentLaborTrade: 'e.g., Operator',
      ph_equipmentLaborRate: '40',
      ph_equipmentLaborHours: '8',
      // Subcontractor translations
      addSubcontractor: 'Add New Subcontractor', // New
      subcontractorName: 'Subcontractor Name', // New
      companyName: 'Company Name', // New
      contactInfo: 'Contact Info (Email/Phone)', // New
      addContact: 'Add Subcontractor', // New
      subcontractorsList: 'Subcontractors List', // New
      noSubcontractors: 'No subcontractors added yet. Use the form above to add subcontractors.', // New
      totalCostForSubcontractor: 'Total Cost for Subcontractor', // New
      subcontractorMaterialCost: 'Material Cost', // New
      subcontractorLaborCost: 'Labor Cost', // New
      subcontractorEquipmentCost: 'Equipment Cost', // New
      subcontractorGrandTotal: 'Grand Total for Subcontractor', // New
      ph_subcontractorName: 'e.g., John Doe', // New
      ph_companyName: 'e.g., ABC Construction Inc.', // New
      ph_contactInfo: 'e.g., john@example.com, 555-123-4567', // New
    },
    es: {
      title: 'Calculadora Avanzada de Costos de Construcción',
      subtitle: 'Agregue múltiples materiales, equipos y calcule costos integrales del proyecto',
      costCalculatorTab: 'Calculadora de Costos',
      schedulingTab: 'Programación',
      costForecastTab: 'Pronóstico de Costos',
      subcontractorsTab: 'Subcontratistas', // New
      addMaterial: 'Agregar Nuevo Material',
      materialName: 'Nombre del Material',
      materialDescription: 'Descripción (Opcional)',
      calculationType: 'Tipo de Cálculo',
      length: units === 'imperial' ? 'Largo (pies)' : 'Largo (m)',
      width: units === 'imperial' ? 'Ancho (pies)' : 'Ancho (m)',
      height: units === 'imperial' ? 'Altura (pies)' : 'Altura (m)',
      lengthFt: 'Largo (pies)',
      widthFt: 'Ancho (pies)',
      heightFt: 'Altura (pies)',
      lengthM: 'Largo (m)',
      widthM: 'Ancho (m)',
      heightM: 'Altura (m)',
      quantity: 'Cantidad/Unidades',
      costPerUnit: `Costo por Unidad (${selectedCurrency.symbol})`,
      costPerSqFt: `Costo por Pie Cuadrado (${selectedCurrency.symbol})`,
      costPerSqM: `Costo por Metro Cuadrado (${selectedCurrency.symbol})`,
      costPerLinearFt: `Costo por Pie Lineal (${selectedCurrency.symbol})`,
      costPerLinearM: `Costo por Metro Lineal (${selectedCurrency.symbol})`,
      costPerIndividualUnit: `Costo por Unidad Individual (${selectedCurrency.symbol})`,
      costPerBeam: `Costo por Viga (${selectedCurrency.symbol})`,
      wastePercentage: '% Desperdicio',
      submittalLink: 'Enlace de Presentación (URL)',
      invoiceLink: 'Enlace de Factura/Proforma (URL)',
      addToList: 'Agregar a Lista de Materiales',
      materialsList: 'Lista de Materiales',
      laborDetails: 'Detalles de Mano de Obra del Proyecto',
      tradeName: 'Nombre del Oficio',
      hourlyRate: `Tarifa por Hora (${selectedCurrency.symbol}/hr)`,
      totalHours: 'Horas Totales',
      numberOfLaborers: 'Número de Trabajadores',
      addTrade: 'Agregar Oficio de Mano de Obra del Proyecto',
      laborCostBreakdown: 'Desglose de Costos de Mano de Obra del Proyecto',
      materialSpecificLabor: 'Mano de Obra Específica del Material (Opcional)',
      materialLaborTrade: 'Oficio',
      materialLaborRate: `Tarifa (${selectedCurrency.symbol}/hr)`,
      materialLaborHours: 'Horas',
      calculate: 'Calcular Costo Total del Proyecto',
      costSummary: 'Resumen de Costos',
      exportPDF: 'Exportar PDF',
      exportExcel: 'Exportar Excel',
      totalMaterialCost: 'Costo Total de Materiales',
      totalProjectLaborCost: 'Costo Total de Mano de Obra del Proyecto',
      totalEquipmentCost: 'Costo Total de Equipo',
      grandTotal: 'Total General:',
      area: 'Cobertura de Área',
      linear: 'Medida Linear',
      units: 'Unidades Individuales',
      beams: 'Vigas/Estructura',
      concrete: 'Componentes de Hormigón',
      remove: 'Eliminar',
      edit: 'Editar',
      imperial: 'Imperial',
      metric: 'Métrico',
      noMaterials: 'No se han agregado materiales aún. Use el formulario arriba para agregar materiales.',
      noLaborTrades: 'No se han agregado oficios de mano de obra del proyecto aún. Use el formulario arriba para agregar oficios.',
      noEquipment: 'No se ha agregado equipo aún. Use el formulario de arriba para agregar equipo.',
      fillRequired: 'Por favor complete todos los campos requeridos',
      currency: 'Moneda',
      baseUnits: 'Unidades Base:',
      wasteAmount: 'Cantidad de Desperdicio:',
      totalUnitsWithWaste: 'Unidades Totales (con desperdicio):',
      totalCost: 'Costo Total:',
      materialLaborCost: 'Costo de Mano de Obra del Material:',
      types: {
        area: 'Basado en área (ej. pisos, pintura, panel de yeso, hormigón, aislamiento)',
        linear: 'Basado en longitud (ej. molduras, tuberías)',
        units: 'Basado en unidades (ej. inodoros, accesorios, puertas, tanques de agua, fosas sépticas)',
        beams: 'Para vigas estructurales, viguetas, montantes (calcula el metraje lineal total/número de vigas)',
        concrete: 'Componentes de hormigón (cemento, arena, grava, agua, alquiler de mezcladora, costos adicionales)',
      },
      concreteCementBags: 'Sacos de Cemento',
      concreteCementCostPerBag: `Costo por Saco (${selectedCurrency.symbol})`,
      concreteSandQty: 'Cantidad de Arena',
      concreteSandUnit: 'Unidad de Arena',
      concreteSandCostPerUnit: `Costo por Unidad de Arena (${selectedCurrency.symbol})`,
      concreteGravelQty: 'Cantidad de Grava',
      concreteGravelUnit: 'Unidad de Grava',
      concreteGravelCostPerUnit: `Costo por Unidad de Grava (${selectedCurrency.symbol})`,
      concreteWaterQty: 'Cantidad de Agua',
      concreteWaterUnit: 'Unidad de Agua',
      concreteWaterCostPerUnit: `Costo por Unidad de Agua (${selectedCurrency.symbol})`,
      concreteMixerRental: 'Costo de Alquiler de Mezcladora (Opcional)',
      concreteAncillaryCost: 'Otro Costo Adicional de Hormigón (Opcional)',
      concreteAncillaryCostName: 'Nombre del Costo Adicional',
      concreteAncillaryCostValue: `Valor del Costo Adicional (${selectedCurrency.symbol})`,
      cuyd: 'yd³',
      cum: 'm³',
      gal: 'gal',
      liter: 'L',
      batch: 'lote',
      concreteComponents: 'Componentes de Hormigón:',
      ft: 'pies',
      m: 'm',
      sqft: 'pies²',
      sqm: 'm²',
      linft: 'pies lin',
      linm: 'm lin',
      cubicYards: 'yardas cúbicas',
      cubicMeters: 'm³',
      totalBeams: 'Total de Vigas:',
      unitConverters: 'Convertidores de Unidades',
      feetToInches: 'Pies  Pulgadas',
      metersToCentimeters: 'Metros  Centímetros',
      feet: 'Pies',
      meters: 'Metros',
      inches: 'Pulgadas',
      centimeters: 'Centímetros',
      convert: 'Convertir',
      inputUnit: 'Unidad de Entrada',
      outputUnit: 'Unidad de Salida',
      calculatedArea: 'Área Calculada:',
      individualBeamLengthFt: 'Largo de Viga Individual (pies)',
      individualBeamWidthFt: 'Ancho de Viga Individual (pies) (Opcional)',
      individualBeamHeightFt: 'Altura de Viga Individual (pies) (Opcional)',
      individualBeamLengthM: 'Largo de Viga Individual (m)',
      individualBeamWidthM: 'Ancho de Viga Individual (m) (Opcional)',
      individualBeamHeightM: 'Altura de Viga Individual (m) (Opcional)',
      totalSpan: 'Longitud Total',
      spacing: 'Espaciado',
      // Placeholders
      ph_materialName: 'ej., Pladur, Inodoro, Viga 2x4',
      ph_materialDescription: 'ej., Resistente al fuego, Blanco, 100 galones de capacidad',
      ph_length: 'pies',
      ph_width: 'pies',
      ph_height: 'pies',
      ph_lengthM: 'm',
      ph_widthM: 'm',
      ph_heightM: 'm',
      ph_concreteCementBags: 'ej., 10',
      ph_concreteCementCostPerBag: 'ej., 5.50',
      ph_concreteSandQty: 'ej., 0.5',
      ph_concreteSandCostPerUnit: 'ej., 30',
      ph_concreteGravelQty: 'ej., 1',
      ph_concreteGravelCostPerUnit: 'ej., 40',
      ph_concreteWaterQty: 'ej., 20',
      ph_concreteWaterCostPerUnit: 'ej., 0.10',
      ph_concreteMixerRental: 'ej., 150',
      ph_concreteAncillaryCostName: 'ej., Varilla',
      ph_concreteAncillaryCostValue: 'ej., 50',
      ph_materialLaborTrade: 'ej., Instalador',
      ph_materialLaborRate: '30',
      ph_materialLaborHours: '4',
      ph_laborTradeName: 'ej., Carpintero',
      ph_laborHourlyRate: '45',
      ph_laborTotalHours: '8',
      ph_numberOfLaborers: '1',
      ph_ftInValue_in: 'ej., 66',
      ph_ftInValue_ft: 'ej., 5.5',
      ph_mCmValue_cm: 'ej., 175',
      ph_mCmValue_m: 'ej., 1.75',
      ph_submittalLink: 'ej., https://ejemplo.com/presentacion-pladur.pdf',
      ph_invoiceLink: 'ej., https://ejemplo.com/factura-inodoro.pdf',
      // Scheduling translations
      scheduleTitle: 'Programa de Construcción',
      addTask: 'Agregar Nueva Tarea',
      taskName: 'Nombre de la Tarea',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      assignedMaterials: 'Materiales Asignados',
      assignedEquipment: 'Equipo Asignado',
      assignedSubcontractor: 'Subcontratista Asignado', // New
      assignMaterialsPlaceholder: 'Seleccionar materiales para esta tarea',
      assignEquipmentPlaceholder: 'Seleccionar equipo para esta tarea',
      assignSubcontractorPlaceholder: 'Seleccionar un subcontratista para esta tarea', // New
      addScheduleTask: 'Agregar Tarea al Programa',
      noScheduleTasks: 'No se han agregado tareas aún. Use el formulario de arriba para crear un programa.',
      exportSchedule: 'Exportar Programa', // Modified
      scheduleExpectedFormat: 'Formato JSON esperado: [{ "taskName": "...", "startDate": "AAAA-MM-DD", "endDate": "AAAA-MM-DD", "assignedMaterialIds": [id_material_1, id_material_2] }]',
      viewSubmittal: 'Ver Presentación',
      viewInvoice: 'Ver Factura',
      // Cost Forecast translations
      costForecastTitle: 'Pronóstico de Costos del Proyecto de Construcción',
      addForecastCost: 'Agregar Nuevo Costo Pronosticado',
      costCategory: 'Categoría de Costo',
      amount: 'Monto',
      land: 'Terreno',
      material: 'Material',
      labor: 'Mano de Obra',
      equipment: 'Equipo',
      other: 'Otros',
      assignedTasks: 'Tareas Programadas Asignadas',
      assignTasksPlaceholder: 'Seleccionar tareas para este costo',
      addForecastItem: 'Agregar Elemento de Pronóstico',
      noForecastCosts: 'No se han agregado costos pronosticados. Use el formulario de arriba para agregar elementos de costo.',
      totalForecastCostByCategory: 'Costo Total Pronosticado por Categoría',
      totalLandCost: 'Costo Total del Terreno:',
      totalMaterialForecastCost: 'Costo Total Pronosticado de Materiales:',
      totalLaborForecastCost: 'Costo Total Pronosticado de Mano de Obra:',
      totalEquipmentForecastCost: 'Costo Total Pronosticado de Equipo:',
      totalOtherCost: 'Costo Total Otros:',
      grandTotalForecast: 'Total General Pronosticado:',
      ph_costName: 'ej., Adquisición de Terreno, Tarifas de Permiso',
      ph_amount: 'ej., 50000',
      // Equipment translations
      addEquipment: 'Agregar Nuevo Equipo',
      equipmentName: 'Nombre del Equipo',
      equipmentDescription: 'Descripción (Opcional)',
      equipmentType: 'Tipo de Equipo',
      purchase: 'Compra',
      rental: 'Alquiler',
      purchaseCost: `Costo de Compra (${selectedCurrency.symbol})`,
      usefulLifeYears: 'Vida Útil (Años, Opcional)',
      rentalRate: `Tarifa de Alquiler (${selectedCurrency.symbol})`,
      rentalUnit: 'Unidad de Alquiler',
      numberOfDays: 'Número de Días',
      numberOfHours: 'Número de Horas (por día)',
      day: 'Día',
      week: 'Semana',
      month: 'Mes',
      hour: 'Hora',
      equipmentSpecificLabor: 'Mano de Obra Específica del Equipo (Opcional)',
      equipmentLaborTrade: 'Oficio',
      equipmentLaborRate: `Tarifa (${selectedCurrency.symbol}/hr)`,
      equipmentLaborHours: 'Horas',
      ph_equipmentName: 'ej., Excavadora, Andamios, Taladro',
      ph_equipmentDescription: 'ej., Trabajo pesado, 20 pies, Inalámbrico',
      ph_purchaseCost: 'ej., 75000',
      ph_usefulLifeYears: 'ej., 10',
      ph_rentalRate: 'ej., 300',
      ph_numberOfDays: 'ej., 5',
      ph_numberOfHours: 'ej., 8',
      ph_equipmentLaborTrade: 'ej., Operador',
      ph_equipmentLaborRate: '40',
      ph_equipmentLaborHours: '8',
      // Subcontractor translations
      addSubcontractor: 'Agregar Nuevo Subcontratista', // New
      subcontractorName: 'Nombre del Subcontratista', // New
      companyName: 'Nombre de la Empresa', // New
      contactInfo: 'Información de Contacto (Correo/Teléfono)', // New
      addContact: 'Agregar Subcontratista', // New
      subcontractorsList: 'Lista de Subcontratistas', // New
      noSubcontractors: 'No se han agregado subcontratistas aún. Use el formulario de arriba para agregar subcontratistas.', // New
      totalCostForSubcontractor: 'Costo Total para Subcontratista', // New
      subcontractorMaterialCost: 'Costo de Materiales', // New
      subcontractorLaborCost: 'Costo de Mano de Obra', // New
      subcontractorEquipmentCost: 'Costo de Equipo', // New
      subcontractorGrandTotal: 'Total General para Subcontratista', // New
      ph_subcontractorName: 'ej., Juan Pérez', // New
      ph_companyName: 'ej., Construcciones ABC S.A.', // New
      ph_contactInfo: 'ej., juan@ejemplo.com, 555-123-4567', // New
    },
    it: {
      title: 'Calcolatore Avanzato Costi di Costruzione',
      subtitle: 'Aggiungi più materiali, attrezzature e calcola i costi complessivi del progetto',
      costCalculatorTab: 'Calcolatore Costi',
      schedulingTab: 'Pianificazione',
      costForecastTab: 'Previsione Costi',
      subcontractorsTab: 'Subappaltatori', // New
      addMaterial: 'Aggiungi Nuovo Materiale',
      materialName: 'Nome Materiale',
      materialDescription: 'Descrizione (Opzionale)',
      calculationType: 'Tipo di Calcolo',
      length: units === 'imperial' ? 'Lunghezza (piedi)' : 'Lunghezza (m)',
      width: units === 'imperial' ? 'Larghezza (piedi)' : 'Larghezza (m)',
      height: units === 'imperial' ? 'Altezza (piedi)' : 'Altezza (m)',
      lengthFt: 'Lunghezza (piedi)',
      widthFt: 'Larghezza (piedi)',
      heightFt: 'Altezza (piedi)',
      lengthM: 'Lunghezza (m)',
      widthM: 'Larghezza (m)',
      heightM: 'Altezza (m)',
      quantity: 'Quantità/Unità',
      costPerUnit: `Costo per Unità (${selectedCurrency.symbol})`,
      costPerSqFt: `Costo per Sq Ft (${selectedCurrency.symbol})`,
      costPerSqM: `Costo per Mq (${selectedCurrency.symbol})`,
      costPerLinearFt: `Costo per Ft Lineare (${selectedCurrency.symbol})`,
      costPerLinearM: `Costo per M Lineare (${selectedCurrency.symbol})`,
      costPerIndividualUnit: `Costo per Unità Individuale (${selectedCurrency.symbol})`,
      costPerBeam: `Costo per Trave (${selectedCurrency.symbol})`,
      wastePercentage: '% Scarto',
      submittalLink: 'Link di Sottomissione (URL)',
      invoiceLink: 'Link Fattura/Proforma (URL)',
      addToList: 'Aggiungi alla Lista Materiali',
      materialsList: 'Lista Materiali',
      laborDetails: 'Dettagli Manodopera Progetto',
      tradeName: 'Nome Mestiere',
      hourlyRate: `Tariffa Oraria (${selectedCurrency.symbol}/ora)`,
      totalHours: 'Ore Totali',
      numberOfLaborers: 'Numero di Lavoratori',
      addTrade: 'Aggiungi Mestiere Manodopera Progetto',
      laborCostBreakdown: 'Ripartizione Costi Manodopera Progetto',
      materialSpecificLabor: 'Manodopera Specifica Materiale (Opzionale)',
      materialLaborTrade: 'Mestiere',
      materialLaborRate: `Tariffa (${selectedCurrency.symbol}/ora)`,
      materialLaborHours: 'Ore',
      calculate: 'Calcola Costo Totale Progetto',
      costSummary: 'Riepilogo Costi',
      exportPDF: 'Esporta PDF',
      exportExcel: 'Esporta Excel',
      totalMaterialCost: 'Costo Totale Materiali',
      totalProjectLaborCost: 'Costo Totale Manodopera Progetto',
      totalEquipmentCost: 'Costo Totale Attrezzature',
      grandTotal: 'Totale Generale:',
      area: 'Copertura Area',
      linear: 'Misura Lineare',
      units: 'Unità Individuali',
      beams: 'Travi/Intelaiatura',
      concrete: 'Componenti Calcestruzzo',
      remove: 'Rimuovi',
      edit: 'Modifica',
      imperial: 'Imperiale',
      metric: 'Métrico',
      noMaterials: 'Nessun materiale aggiunto. Usa il modulo sopra per aggiungere materiali.',
      noLaborTrades: 'Nessun mestiere di manodopera aggiunto. Usa il modulo sopra per aggiungere mestieri.',
      noEquipment: 'Nessuna attrezzatura aggiunta. Usa il modulo sopra per aggiungere attrezzature.',
      fillRequired: 'Compila tutti i campi richiesti',
      currency: 'Valuta',
      baseUnits: 'Unità Base:',
      wasteAmount: 'Quantità di Scarto:',
      totalUnitsWithWaste: 'Unità Totali (con scarto):',
      totalCost: 'Costo Totale:',
      materialLaborCost: 'Costo Manodopera Materiale:',
      types: {
        area: 'Basato su area (es. pavimenti, pittura, cartongesso, calcestruzzo, isolamento)',
        linear: 'Basato su lunghezza (es. modanature, tubazioni)',
        units: 'Basato su unità (es. WC, infissi, porte, serbatoi acqua, fosse settiche)',
        beams: 'Per travi strutturali, travetti, montanti (calcola metratura lineare totale/numero di travi)',
        concrete: 'Componenti calcestruzzo (cemento, sabbia, ghiaia, acqua, noleggio betoniera, costi accessori)',
      },
      concreteCementBags: 'Sacchi di Cemento',
      concreteCementCostPerBag: `Costo per Sacco (${selectedCurrency.symbol})`,
      concreteSandQty: 'Quantità Sabbia',
      concreteSandUnit: 'Unità Sabbia',
      concreteSandCostPerUnit: `Costo per Unità Sabbia (${selectedCurrency.symbol})`,
      concreteGravelQty: 'Quantità Ghiaia',
      concreteGravelUnit: 'Unità Ghiaia',
      concreteGravelCostPerUnit: `Costo per Unità Ghiaia (${selectedCurrency.symbol})`,
      concreteWaterQty: 'Quantità Acqua',
      concreteWaterUnit: 'Unità Acqua',
      concreteWaterCostPerUnit: `Costo per Unità Acqua (${selectedCurrency.symbol})`,
      concreteMixerRental: 'Costo Noleggio Betoniera (Opcionale)',
      concreteAncillaryCost: 'Altri Costi Accessori Calcestruzzo (Opcionale)',
      concreteAncillaryCostName: 'Nome Costo Accessorio',
      concreteAncillaryCostValue: `Valore Costo Accessorio (${selectedCurrency.symbol})`,
      cuyd: 'yd³',
      cum: 'm³',
      gal: 'gal',
      liter: 'L',
      batch: 'lote',
      concreteComponents: 'Componenti Calcestruzzo:',
      ft: 'piedi',
      m: 'm',
      sqft: 'piedi²',
      sqm: 'm²',
      linft: 'piedi lin',
      linm: 'm lin',
      cubicYards: 'yarde cubiche',
      cubicMeters: 'm³',
      totalBeams: 'Totale Travi:',
      unitConverters: 'Convertitori di Unità',
      feetToInches: 'Piedi  Pollici',
      metersToCentimeters: 'Metri  Centimetri',
      feet: 'Piedi',
      meters: 'Metri',
      inches: 'Pollici',
      centimeters: 'Centimetri',
      convert: 'Converti',
      inputUnit: 'Unità di Input',
      outputUnit: 'Unità di Output',
      calculatedArea: 'Area Calcolata:',
      individualBeamLengthFt: 'Lunghezza Trave Individuale (piedi)',
      individualBeamWidthFt: 'Larghezza Trave Individuale (piedi) (Opzionale)',
      individualBeamHeightFt: 'Altezza Trave Individuale (piedi) (Opzionale)',
      individualBeamLengthM: 'Lunghezza Trave Individuale (m)',
      individualBeamWidthM: 'Larghezza Trave Individuale (m) (Opzionale)',
      individualBeamHeightM: 'Altezza Trave Individuale (m) (Opzionale)',
      totalSpan: 'Lunghezza Totale',
      spacing: 'Spaziatura',
      // Placeholders
      ph_materialName: 'es., Cartongesso, WC, Trave 2x4',
      ph_materialDescription: 'es., Resistente al fuoco, Bianco, capacità 100 galloni',
      ph_length: 'piedi',
      ph_width: 'piedi',
      ph_height: 'piedi',
      ph_lengthM: 'm',
      ph_widthM: 'm',
      ph_heightM: 'm',
      ph_concreteCementBags: 'es., 10',
      ph_concreteCementCostPerBag: 'es., 5.50',
      ph_concreteSandQty: 'es., 0.5',
      ph_concreteSandCostPerUnit: 'es., 30',
      ph_concreteGravelQty: 'es., 1',
      ph_concreteGravelCostPerUnit: 'es., 40',
      ph_concreteWaterQty: 'es., 20',
      ph_concreteWaterCostPerUnit: 'es., 0.10',
      ph_concreteMixerRental: 'es., 150',
      ph_concreteAncillaryCostName: 'es., Armatura',
      ph_concreteAncillaryCostValue: 'es., 50',
      ph_materialLaborTrade: 'es., Instalador',
      ph_materialLaborRate: '30',
      ph_materialLaborHours: '4',
      ph_laborTradeName: 'es., Carpintero',
      ph_laborHourlyRate: '45',
      ph_laborTotalHours: '8',
      ph_numberOfLaborers: '1',
      ph_ftInValue_in: 'es., 66',
      ph_ftInValue_ft: 'es., 5.5',
      ph_mCmValue_cm: 'es., 175',
      ph_mCmValue_m: 'es., 1.75',
      ph_submittalLink: 'es., https://esempio.com/presentacion-pladur.pdf',
      ph_invoiceLink: 'es., https://esempio.com/factura-wc.pdf',
      // Scheduling translations
      scheduleTitle: 'Programa de Construcción',
      addTask: 'Agregar Nueva Tarea',
      taskName: 'Nombre de la Tarea',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      assignedMaterials: 'Materiales Asignados',
      assignedEquipment: 'Equipo Asignado',
      assignedSubcontractor: 'Subcontratista Asignado', // New
      assignMaterialsPlaceholder: 'Seleccionar materiales para esta tarea',
      assignEquipmentPlaceholder: 'Seleccionar equipo para esta tarea',
      assignSubcontractorPlaceholder: 'Seleccionar un subcontratista para esta tarea', // New
      addScheduleTask: 'Agregar Tarea al Programa',
      noScheduleTasks: 'No se han agregado tareas aún. Use el formulario de arriba para crear un programa.',
      exportSchedule: 'Exportar Programa', // Modified
      scheduleExpectedFormat: 'Formato JSON esperado: [{ "taskName": "...", "startDate": "AAAA-MM-DD", "endDate": "AAAA-MM-DD", "assignedMaterialIds": [id_material_1, id_material_2] }]',
      viewSubmittal: 'Ver Presentación',
      viewInvoice: 'Ver Factura',
      // Cost Forecast translations
      costForecastTitle: 'Pronóstico de Costos del Proyecto de Construcción',
      addForecastCost: 'Agregar Nuevo Costo Pronosticado',
      costCategory: 'Categoría de Costo',
      amount: 'Monto',
      land: 'Terreno',
      material: 'Material',
      labor: 'Mano de Obra',
      equipment: 'Equipo',
      other: 'Otros',
      assignedTasks: 'Tareas Programadas Asignadas',
      assignTasksPlaceholder: 'Seleccionar tareas para este costo',
      addForecastItem: 'Agregar Elemento de Pronóstico',
      noForecastCosts: 'No se han agregado costos pronosticados. Use el formulario de arriba para agregar elementos de costo.',
      totalForecastCostByCategory: 'Costo Total Pronosticado por Categoría',
      totalLandCost: 'Costo Total del Terreno:',
      totalMaterialForecastCost: 'Costo Total Pronosticado de Materiales:',
      totalLaborForecastCost: 'Costo Total Pronosticado de Mano de Obra:',
      totalEquipmentForecastCost: 'Costo Total Pronosticado de Equipo:',
      totalOtherCost: 'Costo Total Otros:',
      grandTotalForecast: 'Total General Pronosticado:',
      ph_costName: 'ej., Adquisición de Terreno, Tarifas de Permiso',
      ph_amount: 'ej., 50000',
      // Equipment translations
      addEquipment: 'Aggiungi Nuova Attrezzatura',
      equipmentName: 'Nome Attrezzatura',
      equipmentDescription: 'Descrizione (Opzionale)',
      equipmentType: 'Tipo di Attrezzatura',
      purchase: 'Acquisto',
      rental: 'Noleggio',
      purchaseCost: `Costo di Acquisto (${selectedCurrency.symbol})`,
      usefulLifeYears: 'Vita Utile (Anni, Opzionale)',
      rentalRate: `Tariffa di Noleggio (${selectedCurrency.symbol})`,
      rentalUnit: 'Unità di Noleggio',
      numberOfDays: 'Numero di Giorni',
      numberOfHours: 'Numero di Ore (al giorno)',
      day: 'Giorno',
      week: 'Settimana',
      month: 'Mese',
      hour: 'Ora',
      equipmentSpecificLabor: 'Manodopera Specifica Attrezzatura (Opzionale)',
      equipmentLaborTrade: 'Mestiere',
      equipmentLaborRate: `Tariffa (${selectedCurrency.symbol}/ora)`,
      equipmentLaborHours: 'Ore',
      ph_equipmentName: 'es., Escavatore, Ponteggio, Trapano',
      ph_equipmentDescription: 'es., Heavy-duty, 20ft, Cordless',
      ph_purchaseCost: 'es., 75000',
      ph_usefulLifeYears: 'es., 10',
      ph_rentalRate: 'es., 300',
      ph_numberOfDays: 'es., 5',
      ph_numberOfHours: 'es., 8',
      ph_equipmentLaborTrade: 'es., Operatore',
      ph_equipmentLaborRate: '40',
      ph_equipmentLaborHours: '8',
      // Subcontractor translations
      addSubcontractor: 'Aggiungi Nuovo Subappaltatore', // New
      subcontractorName: 'Nome Subappaltatore', // New
      companyName: 'Nome Azienda', // New
      contactInfo: 'Informazioni di Contatto (Email/Telefono)', // New
      addContact: 'Aggiungi Subappaltatore', // New
      subcontractorsList: 'Lista Subappaltatori', // New
      noSubcontractors: 'Nessun subappaltatore aggiunto. Usa il modulo sopra per aggiungere subappaltatori.', // New
      totalCostForSubcontractor: 'Costo Totale per Subappaltatore', // New
      subcontractorMaterialCost: 'Costo Materiali', // New
      subcontractorLaborCost: 'Costo Manodopera', // New
      subcontractorEquipmentCost: 'Costo Attrezzature', // New
      subcontractorGrandTotal: 'Totale Generale per Subappaltatore', // New
      ph_subcontractorName: 'es., Mario Rossi', // New
      ph_companyName: 'es., Costruzioni Alfa S.r.l.', // New
      ph_contactInfo: 'es., mario@esempio.com, 555-123-4567', // New
    },
    fr: {
      title: 'Calculateur Avancé de Coûts de Construction',
      subtitle: 'Ajoutez plusieurs matériaux, équipements et calculez les coûts complets du projet',
      costCalculatorTab: 'Calculateur de Coûts',
      schedulingTab: 'Planification',
      costForecastTab: 'Prévision des Coûts',
      subcontractorsTab: 'Sous-traitants', // New
      addMaterial: 'Ajouter un Nouveau Matériau',
      materialName: 'Nom du Matériau',
      materialDescription: 'Description (Facultatif)',
      calculationType: 'Type de Calcul',
      length: units === 'imperial' ? 'Longueur (pieds)' : 'Longueur (m)',
      width: units === 'imperial' ? 'Largeur (pieds)' : 'Largeur (m)',
      height: units === 'imperial' ? 'Hauteur (pieds)' : 'Hauteur (m)',
      lengthFt: 'Longueur (pieds)',
      widthFt: 'Largeur (pieds)',
      heightFt: 'Hauteur (pieds)',
      lengthM: 'Longueur (m)',
      widthM: 'Largura (m)',
      heightM: 'Hauteur (m)',
      quantity: 'Quantité/Unités',
      costPerUnit: `Coût par Unité (${selectedCurrency.symbol})`,
      costPerSqFt: `Coût par Pied Carré (${selectedCurrency.symbol})`,
      costPerSqM: `Coût par Mètre Carré (${selectedCurrency.symbol})`,
      costPerLinearFt: `Coût par Pied Linéaire (${selectedCurrency.symbol})`,
      costPerLinearM: `Coût par Mètre Linéaire (${selectedCurrency.symbol})`,
      costPerIndividualUnit: `Coût par Unité Individuelle (${selectedCurrency.symbol})`,
      costPerBeam: `Coût par Poutre (${selectedCurrency.symbol})`,
      wastePercentage: '% Déchet',
      submittalLink: 'Lien de Soumission (URL)',
      invoiceLink: 'Lien Facture/Proforma (URL)',
      addToList: 'Ajouter à la Liste des Matériaux',
      materialsList: 'Liste des Matériaux',
      laborDetails: 'Détails de la Main-d\'œuvre du Projet',
      tradeName: 'Nom du Métier',
      hourlyRate: `Taux Horaire (${selectedCurrency.symbol}/h)`,
      totalHours: 'Heures Totales',
      numberOfLaborers: 'Nombre d\'Ouvriers',
      addTrade: 'Ajouter un Métier de Main-d\'œuvre au Projet',
      laborCostBreakdown: 'Répartition des Coûts de Main-d\'œuvre du Projet',
      materialSpecificLabor: 'Main-d\'œuvre Spécifique au Matériau (Facultatif)',
      materialLaborTrade: 'Métier',
      materialLaborRate: `Taux (${selectedCurrency.symbol}/h)`,
      materialLaborHours: 'Heures',
      calculate: 'Calculer le Coût Total du Projet',
      costSummary: 'Résumé des Coûts',
      exportPDF: 'Exporter en PDF',
      exportExcel: 'Exporter en Excel',
      totalMaterialCost: 'Coût Total des Matériaux',
      totalProjectLaborCost: 'Coût Total de la Main-d\'œuvre du Projet',
      totalEquipmentCost: 'Coût Total de l\'Équipement',
      grandTotal: 'Total Général:',
      area: 'Couverture de Zone',
      linear: 'Mesure Linéaire',
      units: 'Unités Individuelles',
      beams: 'Poutres/Charpente',
      concrete: 'Composants en Béton',
      remove: 'Supprimer',
      edit: 'Modifier',
      imperial: 'Impérial',
      metric: 'Métrique',
      noMaterials: 'Aucun matériau ajouté. Utilisez le formulaire ci-dessus pour ajouter des matériaux.',
      noLaborTrades: 'Aucun métier de main-d\'œuvre ajouté. Utilisez le formulaire ci-dessus pour ajouter des métiers.',
      noEquipment: 'Aucun équipement ajouté. Utilisez le formulaire ci-dessus pour ajouter de l\'équipement.',
      fillRequired: 'Veuillez remplir tous les champs requis',
      currency: 'Devise',
      baseUnits: 'Unités de Base:',
      wasteAmount: 'Quantité de Déchet:',
      totalUnitsWithWaste: 'Unités Totales (avec déchet):',
      totalCost: 'Coût Total:',
      materialLaborCost: 'Coût de la Main-d\'œuvre du Matériau:',
      types: {
        area: 'Basé sur la surface (ex. revêtements de sol, peinture, cloisons sèches, béton, isolation)',
        linear: 'Basé sur la longueur (ex. garnitures, tuyauterie)',
        units: 'Basé sur les unités (ex. toilettes, luminaires, portes, réservoirs d\'eau, fosses septiques)',
        beams: 'Pour les poutres structurelles, les solives, les montants (calcule la longueur linéaire totale/nombre de poutres)',
        concrete: 'Composants en béton (ciment, sable, gravier, eau, location de bétonnière, coûts accessoires)',
      },
      concreteCementBags: 'Sacs de Ciment',
      concreteCementCostPerBag: `Coût par Sac (${selectedCurrency.symbol})`,
      concreteSandQty: 'Quantité de Sable',
      concreteSandUnit: 'Unité de Sable',
      concreteSandCostPerUnit: `Coût par Unité de Sable (${selectedCurrency.symbol})`,
      concreteGravelQty: 'Quantité de Gravier',
      concreteGravelUnit: 'Unité de Gravier',
      concreteGravelCostPerUnit: `Coût par Unité de Gravier (${selectedCurrency.symbol})`,
      concreteWaterQty: 'Quantité d\'Eau',
      concreteWaterUnit: 'Unité d\'Eau',
      concreteWaterCostPerUnit: `Coût par Unité d\'Eau (${selectedCurrency.symbol})`,
      concreteMixerRental: 'Coût de Location de Bétonnière (Facultatif)',
      concreteAncillaryCost: 'Autres Coûts Accessoires du Béton (Facultatif)',
      concreteAncillaryCostName: 'Nom du Coût Accessoire',
      concreteAncillaryCostValue: `Valeur du Coût Accessoire (${selectedCurrency.symbol})`,
      cuyd: 'verges³',
      cum: 'm³',
      gal: 'gal',
      liter: 'L',
      batch: 'lot',
      concreteComponents: 'Composants en Béton:',
      ft: 'pieds',
      m: 'm',
      sqft: 'pi²',
      sqm: 'm²',
      linft: 'pi lin',
      linm: 'm lin',
      cubicYards: 'verges cubes',
      cubicMeters: 'm³',
      totalBeams: 'Total des Poutres:',
      unitConverters: 'Convertisseurs d\'Unités',
      feetToInches: 'Pieds  Pouces',
      metersToCentimeters: 'Mètres  Centimètres',
      feet: 'Pieds',
      meters: 'Mètres',
      inches: 'Pouces',
      centimeters: 'Centimètres',
      convert: 'Convertir',
      inputUnit: 'Unité d\'Entrée',
      outputUnit: 'Unité de Sortie',
      calculatedArea: 'Zone Calculée:',
      individualBeamLengthFt: 'Longueur de Poutre Individuelle (pieds)',
      individualBeamWidthFt: 'Largeur de Poutre Individuelle (pieds) (Facultatif)',
      individualBeamHeightFt: 'Hauteur de Poutre Individuelle (pieds) (Facultatif)',
      individualBeamLengthM: 'Longueur de Poutre Individuelle (m)',
      individualBeamWidthM: 'Largeur de Poutre Individuelle (m) (Facultatif)',
      individualBeamHeightM: 'Hauteur de Poutre Individuelle (m) (Facultatif)',
      totalSpan: 'Portée Totale',
      spacing: 'Espacement',
      // Placeholders
      ph_materialName: 'ex., Placo, Toilettes, Poutre 2x4',
      ph_materialDescription: 'ex., Resistente al fuoco, Blanc, capacité de 100 litres',
      ph_length: 'pieds',
      ph_width: 'pieds',
      ph_height: 'pieds',
      ph_lengthM: 'm',
      ph_widthM: 'm',
      ph_heightM: 'm',
      ph_concreteCementBags: 'ex., 10',
      ph_concreteCementCostPerBag: 'ex., 5.50',
      ph_concreteSandQty: 'ex., 0.5',
      ph_concreteSandCostPerUnit: 'ex., 30',
      ph_concreteGravelQty: 'ex., 1',
      ph_concreteGravelCostPerUnit: 'ex., 40',
      ph_concreteWaterQty: 'ex., 20',
      ph_concreteWaterCostPerUnit: 'ex., 0.10',
      ph_concreteMixerRental: 'ex., 150',
      ph_concreteAncillaryCostName: 'ex., Ferraillage',
      ph_concreteAncillaryCostValue: 'ex., 50',
      ph_materialLaborTrade: 'ex., Installateur',
      ph_materialLaborRate: '30',
      ph_materialLaborHours: '4',
      ph_laborTradeName: 'ex., Charpentier',
      ph_laborHourlyRate: '45',
      ph_laborTotalHours: '8',
      ph_numberOfLaborers: '1',
      ph_ftInValue_in: 'ex., 66',
      ph_ftInValue_ft: 'ex., 5.5',
      ph_mCmValue_cm: 'ex., 175',
      ph_mCmValue_m: 'ex., 1.75',
      ph_submittalLink: 'ex., https://exemple.com/soumission-placo.pdf',
      ph_invoiceLink: 'ex., https://exemple.com/factura-toilettes.pdf',
      // Scheduling translations
      scheduleTitle: 'Calendrier de Construction',
      addTask: 'Ajouter une Nouvelle Tâche',
      taskName: 'Nom de la Tâche',
      startDate: 'Date de Début',
      endDate: 'Date de Fin',
      assignedMaterials: 'Matériaux Assignés',
      assignedEquipment: 'Équipement Assigné',
      assignedSubcontractor: 'Sous-traitant Assigné', // New
      assignMaterialsPlaceholder: 'Sélectionner les matériaux pour cette tâche',
      assignEquipmentPlaceholder: 'Sélectionner l\'équipement pour cette tâche',
      assignSubcontractorPlaceholder: 'Sélectionner un sous-traitant pour cette tâche', // New
      addScheduleTask: 'Ajouter la Tâche au Calendrier',
      noScheduleTasks: 'Aucune tâche ajoutée. Utilisez le formulaire ci-dessus pour créer un calendrier.',
      exportSchedule: 'Exporter le Calendrier', // Modified
      scheduleExpectedFormat: 'Format JSON attendu : [{ "taskName": "...", "startDate": "AAAA-MM-JJ", "endDate": "AAAA-MM-JJ", "assignedMaterialIds": [id_materiau_1, id_materiau_2] }]',
      viewSubmittal: 'Voir Soumission',
      viewInvoice: 'Voir Facture',
      // Cost Forecast translations
      costForecastTitle: 'Prévision des Coûts du Projet de Construction',
      addForecastCost: 'Ajouter un Nouveau Coût Prévu',
      costCategory: 'Catégorie de Coût',
      amount: 'Montant',
      land: 'Terrain',
      material: 'Matériau',
      labor: 'Main-d\'œuvre',
      equipment: 'Équipement',
      other: 'Autres',
      assignedTasks: 'Tâches du Calendrier Assignées',
      assignTasksPlaceholder: 'Sélectionner les tâches pour ce coût',
      addForecastItem: 'Ajouter un Élément de Prévision',
      noForecastCosts: 'Aucun coût prévu ajouté. Utilisez le formulaire ci-dessus pour ajouter des éléments de coût.',
      totalForecastCostByCategory: 'Coût Total Prévu par Catégorie',
      totalLandCost: 'Coût Total du Terrain:',
      totalMaterialForecastCost: 'Coût Total Prévu des Matériaux:',
      totalLaborForecastCost: 'Coût Total Prévu de la Main-d\'œuvre:',
      totalEquipmentForecastCost: 'Coût Total Prévu de l\'Équipement:',
      totalOtherCost: 'Coût Total Autres:',
      grandTotalForecast: 'Total Général Prévu:',
      ph_costName: 'ex., Acquisition de terrain, Frais de permis',
      ph_amount: 'ex., 50000',
      // Equipment translations
      addEquipment: 'Ajouter un Nouvel Équipement',
      equipmentName: 'Nom de l\'Équipement',
      equipmentDescription: 'Description (Facultatif)',
      equipmentType: 'Type d\'Équipement',
      purchase: 'Achat',
      rental: 'Location',
      purchaseCost: `Coût d'Achat (${selectedCurrency.symbol})`,
      usefulLifeYears: 'Durée de Vie Utile (Années, Facultatif)',
      rentalRate: `Taux de Location (${selectedCurrency.symbol})`,
      rentalUnit: 'Unité de Location',
      numberOfDays: 'Nombre de Jours',
      numberOfHours: 'Nombre d\'Heures (par jour)',
      day: 'Jour',
      week: 'Semaine',
      month: 'Mois',
      hour: 'Heure',
      equipmentSpecificLabor: 'Main-d\'œuvre Spécifique à l\'Équipement (Facultatif)',
      equipmentLaborTrade: 'Métier',
      equipmentLaborRate: `Taux (${selectedCurrency.symbol}/h)`,
      equipmentLaborHours: 'Heures',
      ph_equipmentName: 'ex., Excavatrice, Échafaudage, Perceuse',
      ph_equipmentDescription: 'ex., Robuste, 20 pieds, Sans fil',
      ph_purchaseCost: 'ex., 75000',
      ph_usefulLifeYears: 'ex., 10',
      ph_rentalRate: 'ex., 300',
      ph_numberOfDays: 'ex., 5',
      ph_numberOfHours: 'ex., 8',
      ph_equipmentLaborTrade: 'ex., Opérateur',
      ph_equipmentLaborRate: '40',
      ph_equipmentLaborHours: '8',
      // Subcontractor translations
      addSubcontractor: 'Ajouter un Nouveau Sous-traitant', // New
      subcontractorName: 'Nom du Sous-traitant', // New
      companyName: 'Nom de l\'Entreprise', // New
      contactInfo: 'Informations de Contact (Email/Téléphone)', // New
      addContact: 'Ajouter un Sous-traitant', // New
      subcontractorsList: 'Liste des Sous-traitants', // New
      noSubcontractors: 'Aucun sous-traitant ajouté. Utilisez le formulaire ci-dessus pour ajouter des sous-traitants.', // New
      totalCostForSubcontractor: 'Coût Total pour le Sous-traitant', // New
      subcontractorMaterialCost: 'Coût des Matériaux', // New
      subcontractorLaborCost: 'Coût de la Main-d\'œuvre', // New
      subcontractorEquipmentCost: 'Coût de l\'Équipement', // New
      subcontractorGrandTotal: 'Total Général pour le Sous-traitant', // New
      ph_subcontractorName: 'ex., Jean Dupont', // New
      ph_companyName: 'ex., Entreprise BTP Inc.', // New
      ph_contactInfo: 'ex., jean@exemple.com, 555-123-4567', // New
    },
    de: {
      title: 'Erweiterter Baukostenrechner',
      subtitle: 'Fügen Sie mehrere Materialien und Geräte hinzu und berechnen Sie umfassende Projektkosten',
      costCalculatorTab: 'Kostenrechner',
      schedulingTab: 'Zeitplanung',
      costForecastTab: 'Kostenprognose',
      subcontractorsTab: 'Subunternehmer', // New
      addMaterial: 'Neues Material hinzufügen',
      materialName: 'Materialname',
      materialDescription: 'Beschreibung (Optional)',
      calculationType: 'Berechnungstyp',
      length: units === 'imperial' ? 'Länge (ft)' : 'Länge (m)',
      width: units === 'imperial' ? 'Breite (ft)' : 'Breite (m)',
      height: units === 'imperial' ? 'Höhe (ft)' : 'Höhe (m)',
      lengthFt: 'Länge (ft)',
      widthFt: 'Breite (ft)',
      heightFt: 'Höhe (ft)',
      lengthM: 'Länge (m)',
      widthM: 'Breite (m)',
      heightM: 'Höhe (m)',
      quantity: 'Menge/Einheiten',
      costPerUnit: `Kosten pro Einheit (${selectedCurrency.symbol})`,
      costPerSqFt: `Kosten pro Quadratfuß (${selectedCurrency.symbol})`,
      costPerSqM: `Kosten pro Quadratmeter (${selectedCurrency.symbol})`,
      costPerLinearFt: `Kosten pro laufendem Fuß (${selectedCurrency.symbol})`,
      costPerLinearM: `Kosten pro laufendem Meter (${selectedCurrency.symbol})`,
      costPerIndividualUnit: `Kosten pro Einheit (${selectedCurrency.symbol})`,
      costPerBeam: `Kosten pro Balken (${selectedCurrency.symbol})`,
      wastePercentage: 'Abfall %',
      submittalLink: 'Einreichungslink (URL)',
      invoiceLink: 'Rechnung/Proforma-Link (URL)',
      addToList: 'Zur Materialliste hinzufügen',
      materialsList: 'Materialliste',
      laborDetails: 'Projektarbeitsdetails',
      tradeName: 'Gewerkname',
      hourlyRate: `Stundensatz (${selectedCurrency.symbol}/Std)`,
      totalHours: 'Gesamtstunden',
      numberOfLaborers: 'Anzahl der Arbeitskräfte',
      addTrade: 'Gewerk für Projektarbeit hinzufügen',
      laborCostBreakdown: 'Aufschlüsselung der Projektarbeitskosten',
      materialSpecificLabor: 'Materialspezifische Arbeit (Optional)',
      materialLaborTrade: 'Gewerk',
      materialLaborRate: `Satz (${selectedCurrency.symbol}/Std)`,
      materialLaborHours: 'Stunden',
      calculate: 'Gesamtprojektkosten berechnen',
      costSummary: 'Kostenübersicht',
      exportPDF: 'PDF exportieren',
      exportExcel: 'Excel exportieren',
      totalMaterialCost: 'Gesamtkosten Material',
      totalProjectLaborCost: 'Gesamtkosten Projektarbeit',
      totalEquipmentCost: 'Gesamtkosten Ausrüstung',
      grandTotal: 'Gesamtsumme:',
      area: 'Flächenabdeckung',
      linear: 'Längenmessung',
      units: 'Einzelne Einheiten',
      beams: 'Balken/Rahmen',
      concrete: 'Betonkomponenten',
      remove: 'Entfernen',
      edit: 'Bearbeiten',
      imperial: 'Imperial',
      metric: 'Metrisch',
      noMaterials: 'Noch keine Materialien hinzugefügt. Verwenden Sie das obige Formular, um Materialien hinzuzufügen.',
      noLaborTrades: 'Noch keine Projektgewerke hinzugefügt. Verwenden Sie das obige Formular, um Gewerke hinzuzufügen.',
      noEquipment: 'Noch keine Ausrüstung hinzugefügt. Verwenden Sie das obige Formular, um Ausrüstung hinzuzufügen.',
      fillRequired: 'Bitte füllen Sie alle erforderlichen Felder aus',
      currency: 'Währung',
      baseUnits: 'Basiseinheiten:',
      wasteAmount: 'Abfallmenge:',
      totalUnitsWithWaste: 'Gesamteinheiten (mit Abfall):',
      totalCost: 'Gesamtkosten:',
      materialLaborCost: 'Materialarbeitskosten:',
      types: {
        area: 'Flächenbasiert (z.B. Bodenbelag, Farbe, Trockenbau, Beton, Dämmung)',
        linear: 'Längenbasiert (z.B. Zierleisten, Rohrleitungen)',
        units: 'Einheitenbasiert (z.B. Toiletten, Armaturen, Türen, Wassertanks, Klärgruben)',
        beams: 'Für tragende Balken, Sparren, Ständer (berechnet die gesamte Lauflänge/Anzahl der Balken)',
        concrete: 'Betonkomponenten (Zement, Sand, Kies, Wasser, Mischervermietung, Nebenkosten)',
      },
      concreteCementBags: 'Zementsäcke',
      concreteCementCostPerBag: `Kosten pro Sack (${selectedCurrency.symbol})`,
      concreteSandQty: 'Sandmenge',
      concreteSandUnit: 'Sandeinheit',
      concreteSandCostPerUnit: `Kosten pro Sandeinheit (${selectedCurrency.symbol})`,
      concreteGravelQty: 'Kiesmenge',
      concreteGravelUnit: 'Kieseinheit',
      concreteGravelCostPerUnit: `Kosten pro Kieseinheit (${selectedCurrency.symbol})`,
      concreteWaterQty: 'Wassermenge',
      concreteWaterUnit: 'Wassereinheit',
      concreteWaterCostPerUnit: `Kosten pro Wassereinheit (${selectedCurrency.symbol})`,
      concreteMixerRental: 'Mischer-Mietkosten (Optional)',
      concreteAncillaryCost: 'Sonstige Beton-Nebenkosten (Optional)',
      concreteAncillaryCostName: 'Name der Nebenkosten',
      concreteAncillaryCostValue: `Wert der Nebenkosten (${selectedCurrency.symbol})`,
      cuyd: 'yd³',
      cum: 'm³',
      gal: 'gal',
      liter: 'L',
      batch: 'Charge',
      concreteComponents: 'Betonkomponenten:',
      ft: 'ft',
      m: 'm',
      sqft: 'ft²',
      sqm: 'm²',
      linft: 'lfm',
      linm: 'lfm',
      cubicYards: 'Kubikyards',
      cubicMeters: 'm³',
      totalBeams: 'Gesamtbalken:',
      unitConverters: 'Einheitenumrechner',
      feetToInches: 'Fuß  Zoll',
      metersToCentimeters: 'Meter  Zentimeter',
      feet: 'Fuß',
      meters: 'Meter',
      inches: 'Zoll',
      centimeters: 'Zentimeter',
      convert: 'Umrechnen',
      inputUnit: 'Eingabeeinheit',
      outputUnit: 'Ausgabeeinheit',
      calculatedArea: 'Berechnete Fläche:',
      individualBeamLengthFt: 'Einzellänge Balken (ft)',
      individualBeamWidthFt: 'Einzelbreite Balken (ft) (Optional)',
      individualBeamHeightFt: 'Einzelhöhe Balken (ft) (Optional)',
      individualBeamLengthM: 'Einzellänge Balken (m)',
      individualBeamWidthM: 'Einzelbreite Balken (m) (Optional)',
      individualBeamHeightM: 'Einzelhöhe Balken (m) (Optional)',
      totalSpan: 'Gesamtspannweite',
      spacing: 'Abstand',
      // Placeholders
      ph_materialName: 'z.B. Trockenbau, Toilette, 2x4 Balken',
      ph_materialDescription: 'z.B. Feuerfest, Weiß, 100 Gallonen Kapazität',
      ph_length: 'ft',
      ph_width: 'ft',
      ph_height: 'ft',
      ph_lengthM: 'm',
      ph_widthM: 'm',
      ph_heightM: 'm',
      ph_concreteCementBags: 'z.B. 10',
      ph_concreteCementCostPerBag: 'z.B. 5.50',
      ph_concreteSandQty: 'z.B. 0.5',
      ph_concreteSandCostPerUnit: 'z.B. 30',
      ph_concreteGravelQty: 'z.B. 1',
      ph_concreteGravelCostPerUnit: 'z.B. 40',
      ph_concreteWaterQty: 'z.B. 20',
      ph_concreteWaterCostPerUnit: 'z.B. 0.10',
      ph_concreteMixerRental: 'z.B. 150',
      ph_concreteAncillaryCostName: 'z.B. Bewehrungsstahl',
      ph_concreteAncillaryCostValue: 'z.B. 50',
      ph_materialLaborTrade: 'z.B. Installateur',
      ph_materialLaborRate: '30',
      ph_materialLaborHours: '4',
      ph_laborTradeName: 'z.B. Zimmermann',
      ph_laborHourlyRate: '45',
      ph_laborTotalHours: '8',
      ph_numberOfLaborers: '1',
      ph_ftInValue_in: 'z.B. 66',
      ph_ftInValue_ft: 'z.B. 5.5',
      ph_mCmValue_cm: 'z.B. 175',
      ph_mCmValue_m: 'z.B. 1.75',
      ph_submittalLink: 'z.B. https://beispiel.com/trockenbau-einreichung.pdf',
      ph_invoiceLink: 'z.B. https://beispiel.com/toilette-rechnung.pdf',
      // Cost Forecast translations
      costForecastTitle: 'Baukostenprognose',
      addForecastCost: 'Neue Kostenprognose hinzufügen',
      costCategory: 'Kostenkategorie',
      amount: 'Betrag',
      land: 'Grundstück',
      material: 'Material',
      labor: 'Arbeit',
      equipment: 'Ausrüstung',
      other: 'Sonstiges',
      assignedTasks: 'Zugewiesene Zeitplanaufgaben',
      assignTasksPlaceholder: 'Aufgaben für diese Kosten auswählen',
      addForecastItem: 'Prognoseelement hinzufügen',
      noForecastCosts: 'Noch keine Kostenprognosen hinzugefügt. Verwenden Sie das obige Formular, um Kostenelemente hinzuzufügen.',
      totalForecastCostByCategory: 'Gesamtkostenprognose nach Kategorie',
      totalLandCost: 'Gesamtkosten Grundstück:',
      totalMaterialForecastCost: 'Gesamtkosten Materialprognose:',
      totalLaborForecastCost: 'Gesamtkosten Arbeitsprognose:',
      totalEquipmentForecastCost: 'Gesamtkosten Ausrüstungsprognose:',
      totalOtherCost: 'Gesamtkosten Sonstiges:',
      grandTotalForecast: 'Gesamtprognose:',
      ph_costName: 'z.B. Grundstückserwerb, Genehmigungsgebühren',
      ph_amount: 'z.B. 50000',
      // Equipment translations
      addEquipment: 'Neue Ausrüstung hinzufügen',
      equipmentName: 'Name der Ausrüstung',
      equipmentDescription: 'Beschreibung (Optional)',
      equipmentType: 'Ausrüstungstyp',
      purchase: 'Kauf',
      rental: 'Miete',
      purchaseCost: `Kaufkosten (${selectedCurrency.symbol})`,
      usefulLifeYears: 'Nutzungsdauer (Jahre, Optional)',
      rentalRate: `Mietpreis (${selectedCurrency.symbol})`,
      rentalUnit: 'Mieteinheit',
      numberOfDays: 'Anzahl der Tage',
      numberOfHours: 'Anzahl der Stunden (pro Tag)',
      day: 'Tag',
      week: 'Woche',
      month: 'Monat',
      hour: 'Stunde',
      equipmentSpecificLabor: 'Ausrüstungsspezifische Arbeit (Optional)',
      equipmentLaborTrade: 'Gewerk',
      equipmentLaborRate: `Satz (${selectedCurrency.symbol}/Std)`,
      equipmentLaborHours: 'Stunden',
      ph_equipmentName: 'z.B. Bagger, Gerüst, Bohrmaschine',
      ph_equipmentDescription: 'z.B. Schwerlast, 20ft, Akku',
      ph_purchaseCost: 'z.B. 75000',
      ph_usefulLifeYears: 'z.B. 10',
      ph_rentalRate: 'z.B. 300',
      ph_numberOfDays: 'z.B. 5',
      ph_numberOfHours: 'z.B. 8',
      ph_equipmentLaborTrade: 'z.B. Bediener',
      ph_equipmentLaborRate: '40',
      ph_equipmentLaborHours: '8',
      // Subcontractor translations
      addSubcontractor: 'Neuen Subunternehmer hinzufügen', // New
      subcontractorName: 'Name des Subunternehmers', // New
      companyName: 'Firmenname', // New
      contactInfo: 'Kontaktinformationen (E-Mail/Telefon)', // New
      addContact: 'Subunternehmer hinzufügen', // New
      subcontractorsList: 'Subunternehmerliste', // New
      noSubcontractors: 'Noch keine Subunternehmer hinzugefügt. Verwenden Sie das obige Formular, um Subunternehmer hinzuzufügen.', // New
      totalCostForSubcontractor: 'Gesamtkosten für Subunternehmer', // New
      subcontractorMaterialCost: 'Materialkosten', // New
      subcontractorLaborCost: 'Arbeitskosten', // New
      subcontractorEquipmentCost: 'Ausrüstungskosten', // New
      subcontractorGrandTotal: 'Gesamtsumme für Subunternehmer', // New
      ph_subcontractorName: 'z.B. Max Mustermann', // New
      ph_companyName: 'z.B. Musterbau GmbH', // New
      ph_contactInfo: 'z.B. max@beispiel.de, 0123-456789', // New
    },
    zh: {
      title: '高级建筑成本计算器',
      subtitle: '添加多种材料、设备并计算全面的项目成本',
      costCalculatorTab: '成本计算器',
      schedulingTab: '排期',
      costForecastTab: '成本预测',
      subcontractorsTab: '分包商', // New
      addMaterial: '添加新材料',
      materialName: '材料名称',
      materialDescription: '描述（可选）',
      calculationType: '计算类型',
      length: units === 'imperial' ? '长度（英尺）' : '长度（米）',
      width: units === 'imperial' ? '宽度（英尺）' : '宽度（米）',
      height: units === 'imperial' ? '高度（英尺）' : '高度（米）',
      lengthFt: '长度（英尺）',
      widthFt: '宽度（英尺）',
      heightFt: '高度（英尺）',
      lengthM: '长度（米）',
      widthM: '宽度（米）',
      heightM: '高度（米）',
      quantity: '数量/单位',
      costPerUnit: `单位成本（${selectedCurrency.symbol}）`,
      costPerSqFt: `每平方英尺成本（${selectedCurrency.symbol}）`,
      costPerSqM: `每平方米成本（${selectedCurrency.symbol}）`,
      costPerLinearFt: `每线性英尺成本（${selectedCurrency.symbol}）`,
      costPerLinearM: `每线性米成本（${selectedCurrency.symbol}）`,
      costPerIndividualUnit: `每单位成本（${selectedCurrency.symbol}）`,
      costPerBeam: `每梁成本（${selectedCurrency.symbol}）`,
      wastePercentage: '损耗百分比',
      submittalLink: '提交链接（URL）',
      invoiceLink: '发票/形式发票链接（URL）',
      addToList: '添加到材料清单',
      materialsList: '材料清单',
      laborDetails: '项目人工详情',
      tradeName: '工种名称',
      hourlyRate: `每小时费率（${selectedCurrency.symbol}/小时）`,
      totalHours: '总小时数',
      numberOfLaborers: '工人数量',
      addTrade: '添加项目工种',
      laborCostBreakdown: '项目人工成本明细',
      materialSpecificLabor: '材料特定人工（可选）',
      materialLaborTrade: '工种',
      materialLaborRate: `费率（${selectedCurrency.symbol}/小时）`,
      materialLaborHours: '小时数',
      calculate: '计算项目总成本',
      costSummary: '成本摘要',
      exportPDF: '导出PDF',
      exportExcel: '导出Excel',
      totalMaterialCost: '总材料成本',
      totalProjectLaborCost: '总项目人工成本',
      totalEquipmentCost: '总设备成本',
      grandTotal: '总计：',
      area: '面积覆盖',
      linear: '线性测量',
      units: '独立单位',
      beams: '梁/框架',
      concrete: '混凝土组件',
      remove: '移除',
      edit: '编辑',
      imperial: '英制',
      metric: '公制',
      noMaterials: '尚未添加材料。请使用上方表格添加材料。',
      noLaborTrades: '尚未添加项目工种。请使用上方表格添加工种。',
      noEquipment: '尚未添加设备。请使用上方表格添加设备。',
      fillRequired: '请填写所有必填字段',
      currency: '货币',
      baseUnits: '基本单位：',
      wasteAmount: '损耗量：',
      totalUnitsWithWaste: '总单位（含损耗）：',
      totalCost: '总成本：',
      materialLaborCost: '材料人工成本：',
      types: {
        area: '基于面积（例如，地板、油漆、石膏板、混凝土、绝缘材料）',
        linear: '基于线性（例如，装饰条、管道）',
        units: '基于单位（例如，马桶、固定装置、门、水箱、化粪池）',
        beams: '用于结构梁、托梁、立柱（计算总线性英尺/梁的数量）',
        concrete: '混凝土组件（水泥、沙子、碎石、水、搅拌机租赁、辅助成本）',
      },
      concreteCementBags: '水泥袋',
      concreteCementCostPerBag: `每袋成本（${selectedCurrency.symbol}）`,
      concreteSandQty: '沙子数量',
      concreteSandUnit: '沙子单位',
      concreteSandCostPerUnit: `每沙子单位成本（${selectedCurrency.symbol}）`,
      concreteGravelQty: '碎石数量',
      concreteGravelUnit: '碎石单位',
      concreteGravelCostPerUnit: `每碎石单位成本（${selectedCurrency.symbol}）`,
      concreteWaterQty: '水数量',
      concreteWaterUnit: '水单位',
      concreteWaterCostPerUnit: `每水单位成本（${selectedCurrency.symbol}）`,
      concreteMixerRental: '搅拌机租赁成本（可选）',
      concreteAncillaryCost: '其他混凝土辅助成本（可选）',
      concreteAncillaryCostName: '辅助成本名称',
      concreteAncillaryCostValue: `辅助成本价值（${selectedCurrency.symbol}）`,
      cuyd: '立方码',
      cum: '立方米',
      gal: '加仑',
      liter: '升',
      batch: '批次',
      concreteComponents: '混凝土组件：',
      ft: '英尺',
      m: '米',
      sqft: '平方英尺',
      sqm: '平方米',
      linft: '线性英尺',
      linm: '线性米',
      cubicYards: '立方码',
      cubicMeters: '立方米',
      totalBeams: '总梁数：',
      unitConverters: '单位转换器',
      feetToInches: '英尺  英寸',
      metersToCentimeters: '米  厘米',
      feet: '英尺',
      meters: '米',
      inches: '英寸',
      centimeters: '厘米',
      convert: '转换',
      inputUnit: '输入单位',
      outputUnit: '输出单位',
      calculatedArea: '计算面积：',
      individualBeamLengthFt: '单梁长度（英尺）',
      individualBeamWidthFt: '单梁宽度（英尺）（可选）',
      individualBeamHeightFt: '单梁高度（英尺）（可选）',
      individualBeamLengthM: '单梁长度（米）',
      individualBeamWidthM: '单梁宽度（米）（可选）',
      individualBeamHeightM: '单梁高度（米）（可选）',
      totalSpan: '总跨度',
      spacing: '间距',
      // Placeholders
      ph_materialName: '例如：石膏板、马桶、2x4梁',
      ph_materialDescription: '例如：防火、白色、100加仑容量',
      ph_length: '英尺',
      ph_width: '英尺',
      ph_height: '英尺',
      ph_lengthM: '米',
      ph_widthM: '米',
      ph_heightM: '米',
      ph_concreteCementBags: '例如：10',
      ph_concreteCementCostPerBag: '例如：5.50',
      ph_concreteSandQty: '例如：0.5',
      ph_concreteSandCostPerUnit: '例如：30',
      ph_concreteGravelQty: '例如：1',
      ph_concreteGravelCostPerUnit: '例如：40',
      ph_concreteWaterQty: '例如：20',
      ph_concreteWaterCostPerUnit: '例如：0.10',
      ph_concreteMixerRental: '例如：150',
      ph_concreteAncillaryCostName: '例如：钢筋',
      ph_concreteAncillaryCostValue: '例如：50',
      ph_materialLaborTrade: '例如：安装工',
      ph_materialLaborRate: '30',
      ph_materialLaborHours: '4',
      ph_laborTradeName: '例如：木匠',
      ph_laborHourlyRate: '45',
      ph_laborTotalHours: '8',
      ph_numberOfLaborers: '1',
      ph_ftInValue_in: '例如：66',
      ph_ftInValue_ft: '例如：5.5',
      ph_mCmValue_cm: '例如：175',
      ph_mCmValue_m: '例如：1.75',
      ph_submittalLink: '例如：https://example.com/drywall-submittal.pdf',
      ph_invoiceLink: '例如：https://example.com/toilet-invoice.pdf',
      // Scheduling translations
      scheduleTitle: '施工进度表',
      addTask: '添加新任务',
      taskName: '任务名称',
      startDate: '开始日期',
      endDate: '结束日期',
      assignedMaterials: '分配的材料',
      assignedEquipment: '分配的设备',
      assignedSubcontractor: '分配的分包商', // New
      assignMaterialsPlaceholder: '选择此任务的材料',
      assignEquipmentPlaceholder: '选择此任务的设备',
      assignSubcontractorPlaceholder: '选择此任务的分包商', // New
      addScheduleTask: '添加到进度表',
      noScheduleTasks: '尚未添加任务。请使用上方表格创建进度表。',
      exportSchedule: '导出进度表', // Modified
      scheduleExpectedFormat: '预期JSON格式：[{ "taskName": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "assignedMaterialIds": [material_id_1, material_id_2] }]',
      viewSubmittal: '查看提交',
      viewInvoice: '查看发票',
      // Cost Forecast translations
      costForecastTitle: '建筑项目成本预测',
      addForecastCost: '添加新预测成本',
      costCategory: '成本类别',
      amount: '金额',
      land: '土地',
      material: '材料',
      labor: '人工',
      equipment: '设备',
      other: '其他',
      assignedTasks: '已分配的进度任务',
      assignTasksPlaceholder: '选择此成本的任务',
      addForecastItem: '添加预测项目',
      noForecastCosts: '尚未添加预测成本。请使用上方表格添加成本项目。',
      totalForecastCostByCategory: '按类别划分的总预测成本',
      totalLandCost: '总土地成本：',
      totalMaterialForecastCost: '总材料预测成本：',
      totalLaborForecastCost: '总人工预测成本：',
      totalEquipmentForecastCost: '总设备预测成本：',
      totalOtherCost: '总其他成本：',
      grandTotalForecast: '总预测：',
      ph_costName: '例如：土地购置、许可证费用',
      ph_amount: '例如：50000',
      // Equipment translations
      addEquipment: '添加新设备',
      equipmentName: '设备名称',
      equipmentDescription: '描述（可选）',
      equipmentType: '设备类型',
      purchase: '购买',
      rental: '租赁',
      purchaseCost: `购买成本（${selectedCurrency.symbol}）`,
      usefulLifeYears: '使用寿命（年，可选）',
      rentalRate: `租赁费率（${selectedCurrency.symbol}）`,
      rentalUnit: '租赁单位',
      numberOfDays: '天数',
      numberOfHours: '小时数（每天）',
      day: '天',
      week: '周',
      month: '月',
      hour: '小时',
      equipmentSpecificLabor: '设备特定人工（可选）',
      equipmentLaborTrade: '工种',
      equipmentLaborRate: `费率（${selectedCurrency.symbol}/小时）`,
      equipmentLaborHours: '小时数',
      ph_equipmentName: '例如：挖掘机、脚手架、钻机',
      ph_equipmentDescription: '例如：重型、20英尺、无绳',
      ph_purchaseCost: '例如：75000',
      ph_usefulLifeYears: '例如：10',
      ph_rentalRate: '例如：300',
      ph_numberOfDays: '例如：5',
      ph_numberOfHours: '例如：8',
      ph_equipmentLaborTrade: '例如：操作员',
      ph_equipmentLaborRate: '40',
      ph_equipmentLaborHours: '8',
      // Subcontractor translations
      addSubcontractor: '添加新分包商', // New
      subcontractorName: '分包商名称', // New
      companyName: '公司名称', // New
      contactInfo: '联系信息（电子邮件/电话）', // New
      addContact: '添加分包商', // New
      subcontractorsList: '分包商列表', // New
      noSubcontractors: '尚未添加分包商。请使用上方表格添加分包商。', // New
      totalCostForSubcontractor: '分包商总成本', // New
      subcontractorMaterialCost: '材料成本', // New
      subcontractorLaborCost: '人工成本', // New
      subcontractorEquipmentCost: '设备成本', // New
      subcontractorGrandTotal: '分包商总计', // New
      ph_subcontractorName: '例如：张三', // New
      ph_companyName: '例如：ABC 建筑公司', // New
      ph_contactInfo: '例如：zhangsan@example.com, 13800138000', // New
    }
  };

  const t = translations[language];

  // Helper to convert feet to a single feet decimal value (no inches input here)
  const toFeetDecimal = (ft) => {
    return parseFloat(ft || 0);
  };

  // Helper to convert meters to a single meter decimal value (no cm input here)
  const toMetersDecimal = (m) => {
    return parseFloat(m || 0);
  };

  // Helper to convert meters to feet
  const metersToFeet = (meters) => {
    return meters / 0.3048;
  };

  // Helper to convert feet to meters
  const feetToMeters = (feet) => {
    return feet * 0.3048;
  };

  const handleUnitsChange = (newUnits) => {
    if (newUnits === units) return;

    // Convert materials
    const convertedMaterials = materials.map(material => {
      const newMaterialData = { ...material };

      // Convert dimensions based on type
      if (newMaterialData.type === 'area' || newMaterialData.type === 'linear') {
        if (units === 'imperial' && newUnits === 'metric') {
          newMaterialData.lengthM = feetToMeters(toFeetDecimal(material.lengthFt)).toFixed(2);
          newMaterialData.widthM = material.widthFt ? feetToMeters(toFeetDecimal(material.widthFt)).toFixed(2) : '';
          newMaterialData.heightM = material.heightFt ? feetToMeters(toFeetDecimal(material.heightFt)).toFixed(2) : '';
          newMaterialData.lengthFt = '';
          newMaterialData.widthFt = '';
          newMaterialData.heightFt = '';
        } else if (units === 'metric' && newUnits === 'imperial') {
          newMaterialData.lengthFt = metersToFeet(toMetersDecimal(material.lengthM)).toFixed(2);
          newMaterialData.widthFt = material.widthM ? metersToFeet(toMetersDecimal(material.widthM)).toFixed(2) : '';
          newMaterialData.heightFt = material.heightM ? metersToFeet(toMetersDecimal(material.heightM)).toFixed(2) : '';
          newMaterialData.lengthM = '';
          newMaterialData.widthM = '';
          newMaterialData.heightM = '';
        }
      } else if (newMaterialData.type === 'beams') {
        if (units === 'imperial' && newUnits === 'metric') {
          newMaterialData.beamLengthM = feetToMeters(toFeetDecimal(material.beamLengthFt)).toFixed(2);
          newMaterialData.beamWidthM = material.beamWidthFt ? feetToMeters(toFeetDecimal(material.beamWidthFt)).toFixed(2) : '';
          newMaterialData.beamHeightM = material.beamHeightFt ? feetToMeters(toFeetDecimal(material.beamHeightFt)).toFixed(2) : '';
          newMaterialData.totalSpanM = feetToMeters(toFeetDecimal(material.totalSpanFt)).toFixed(2);
          newMaterialData.spacingM = feetToToMeters(toFeetDecimal(material.spacingFt)).toFixed(2);

          newMaterialData.beamLengthFt = '';
          newMaterialData.beamWidthFt = '';
          newMaterialData.beamHeightFt = '';
          newMaterialData.totalSpanFt = '';
          newMaterialData.spacingFt = '';
        } else if (units === 'metric' && newUnits === 'imperial') {
          newMaterialData.beamLengthFt = metersToFeet(toMetersDecimal(material.beamLengthM)).toFixed(2);
          newMaterialData.beamWidthFt = material.beamWidthM ? metersToFeet(toMetersDecimal(material.beamWidthM)).toFixed(2) : '';
          newMaterialData.beamHeightFt = material.beamHeightM ? metersToFeet(toMetersDecimal(material.beamHeightM)).toFixed(2) : '';
          newMaterialData.totalSpanFt = metersToFeet(toMetersDecimal(material.totalSpanM)).toFixed(2);
          newMaterialData.spacingFt = metersToFeet(toMetersDecimal(material.spacingM)).toFixed(2);

          newMaterialData.beamLengthM = '';
          newMaterialData.beamWidthM = '';
          newMaterialData.beamHeightM = '';
          newMaterialData.totalSpanM = '';
          newMaterialData.spacingM = '';
        }
      }
      return newMaterialData;
    });

    // Convert new material form inputs
    const convertedNewMaterial = { ...newMaterial };
    if (units === 'imperial' && newUnits === 'metric') {
      convertedNewMaterial.lengthM = newMaterial.lengthFt ? feetToMeters(toFeetDecimal(newMaterial.lengthFt)).toFixed(2) : '';
      convertedNewMaterial.widthM = newMaterial.widthFt ? feetToMeters(toFeetDecimal(newMaterial.widthFt)).toFixed(2) : '';
      convertedNewMaterial.heightM = newMaterial.heightFt ? feetToMeters(toFeetDecimal(newMaterial.heightFt)).toFixed(2) : '';

      convertedNewMaterial.lengthFt = '';
      convertedNewMaterial.widthFt = '';
      convertedNewMaterial.heightFt = '';

      convertedNewMaterial.beamLengthM = newMaterial.beamLengthFt ? feetToMeters(toFeetDecimal(newMaterial.beamLengthFt)).toFixed(2) : '';
      convertedNewMaterial.beamWidthM = newMaterial.beamWidthFt ? feetToMeters(toFeetDecimal(newMaterial.beamWidthFt)).toFixed(2) : '';
      convertedNewMaterial.beamHeightM = newMaterial.beamHeightFt ? feetToMeters(toFeetDecimal(newMaterial.beamHeightFt)).toFixed(2) : '';
      convertedNewMaterial.totalSpanM = newMaterial.totalSpanFt ? feetToMeters(toFeetDecimal(newMaterial.totalSpanFt)).toFixed(2) : '';
      convertedNewMaterial.spacingM = newMaterial.spacingFt ? feetToMeters(toFeetDecimal(newMaterial.spacingFt)).toFixed(2) : '';

      convertedNewMaterial.beamLengthFt = '';
      convertedNewMaterial.beamWidthFt = '';
      convertedNewMaterial.beamHeightFt = '';
      convertedNewMaterial.totalSpanFt = '';
      convertedNewMaterial.spacingFt = '';

    } else if (units === 'metric' && newUnits === 'imperial') {
      convertedNewMaterial.lengthFt = newMaterial.lengthM ? metersToFeet(toMetersDecimal(newMaterial.lengthM)).toFixed(2) : '';
      convertedNewMaterial.widthFt = newMaterial.widthM ? metersToFeet(toMetersDecimal(newMaterial.widthM)).toFixed(2) : '';
      convertedNewMaterial.heightFt = newMaterial.heightM ? metersToFeet(toMetersDecimal(newMaterial.heightM)).toFixed(2) : '';

      convertedNewMaterial.lengthM = '';
      convertedNewMaterial.widthM = '';
      convertedNewMaterial.heightM = '';

      convertedNewMaterial.beamLengthFt = newMaterial.beamLengthM ? metersToFeet(toMetersDecimal(newMaterial.beamLengthM)).toFixed(2) : '';
      convertedNewMaterial.beamWidthFt = newMaterial.beamWidthM ? metersToFeet(toMetersDecimal(newMaterial.beamWidthM)).toFixed(2) : '';
      convertedNewMaterial.beamHeightFt = newMaterial.beamHeightM ? metersToFeet(toMetersDecimal(newMaterial.beamHeightM)).toFixed(2) : '';
      convertedNewMaterial.totalSpanFt = newMaterial.totalSpanM ? metersToFeet(toMetersDecimal(newMaterial.totalSpanM)).toFixed(2) : '';
      convertedNewMaterial.spacingFt = newMaterial.spacingM ? metersToFeet(toMetersDecimal(newMaterial.spacingM)).toFixed(2) : '';

      convertedNewMaterial.beamLengthM = '';
      convertedNewMaterial.beamWidthM = '';
      convertedNewMaterial.beamHeightM = '';
      convertedNewMaterial.totalSpanM = '';
      convertedNewMaterial.spacingM = '';
    }

    setMaterials(convertedMaterials);
    setNewMaterial(convertedNewMaterial);
    setUnits(newUnits);
  };

  const calculateMaterialCost = (material) => {
    const { type, quantity, costPerUnit, wastePercentage } = material;
    let totalUnits = 0;
    let unitType = '';
    let volume = 0;
    let materialCost = 0;
    let calculatedArea = 0;

    let length, width, height;
    if (units === 'imperial') {
      length = toFeetDecimal(material.lengthFt);
      width = toFeetDecimal(material.widthFt);
      height = toFeetDecimal(material.heightFt);
    } else {
      length = toMetersDecimal(material.lengthM);
      width = toMetersDecimal(material.widthM);
      height = toMetersDecimal(material.heightM);
    }

    switch (type) {
      case 'area':
        if (length && width) {
          totalUnits = length * width;
          calculatedArea = totalUnits;
          unitType = units === 'imperial' ? t.sqft : t.sqm;
          if (height) {
            volume = totalUnits * height;
            unitType = units === 'imperial' ? t.cubicYards : t.cubicMeters;
            if (units === 'imperial') volume /= 27;
            totalUnits = volume;
          }
        }
        materialCost = totalUnits * parseFloat(costPerUnit || 0);
        break;
      case 'linear':
        totalUnits = parseFloat(length || 0);
        unitType = units === 'imperial' ? t.linft : t.linm;
        materialCost = totalUnits * parseFloat(costPerUnit || 0);
        break;
      case 'units':
        totalUnits = parseFloat(quantity || 0);
        unitType = t.units;
        materialCost = totalUnits * parseFloat(costPerUnit || 0);
        break;
      case 'beams':
        let beamLength, beamWidth, beamHeight, totalSpan, spacing;
        if (units === 'imperial') {
          beamLength = toFeetDecimal(material.beamLengthFt);
          beamWidth = toFeetDecimal(material.beamWidthFt);
          beamHeight = toFeetDecimal(material.beamHeightFt);
          totalSpan = toFeetDecimal(material.totalSpanFt);
          spacing = toFeetDecimal(material.spacingFt);
        } else {
          beamLength = toMetersDecimal(material.beamLengthM);
          beamWidth = toMetersDecimal(material.beamWidthM);
          beamHeight = toMetersDecimal(material.beamHeightM);
          totalSpan = toMetersDecimal(material.totalSpanM);
          spacing = toMetersDecimal(material.spacingM);
        }

        if (beamLength && totalSpan && spacing) {
          const numberOfBeams = Math.ceil(totalSpan / spacing);
          totalUnits = numberOfBeams;
          unitType = t.totalBeams;
        }
        materialCost = totalUnits * parseFloat(costPerUnit || 0);
        break;
      case 'concrete':
        totalUnits = 1;
        unitType = t.batch;

        const cementCost = parseFloat(material.concreteCementBags || 0) * parseFloat(material.concreteCementCostPerBag || 0);
        const sandCost = parseFloat(material.concreteSandQty || 0) * parseFloat(material.concreteSandCostPerUnit || 0);
        const gravelCost = parseFloat(material.concreteGravelQty || 0) * parseFloat(material.concreteGravelCostPerUnit || 0);
        const waterCost = parseFloat(material.concreteWaterQty || 0) * parseFloat(material.concreteWaterCostPerUnit || 0);
        const mixerCost = parseFloat(material.concreteMixerRentalCost || 0);
        const ancillaryConcreteCost = parseFloat(material.concreteAncillaryCostValue || 0);

        materialCost = cementCost + sandCost + gravelCost + waterCost + mixerCost + ancillaryConcreteCost;
        break;
      default:
        totalUnits = 0;
        unitType = '';
        materialCost = 0;
    }

    const wasteFactor = 1 + (parseFloat(wastePercentage) / 100);
    const finalMaterialCost = (type === 'concrete' ? materialCost : materialCost) * wasteFactor; // Waste applies to total concrete cost too

    // Material-specific labor cost is calculated here but NOT added to finalMaterialCost
    const materialSpecificLaborCost = parseFloat(material.materialLaborRate || 0) * parseFloat(material.materialLaborHours || 0) * parseFloat(material.materialLaborNumberOfLaborers || 1);

    return {
      baseUnits: totalUnits,
      wasteAmount: totalUnits * (parseFloat(wastePercentage) / 100),
      totalUnits: totalUnits * wasteFactor,
      totalCost: finalMaterialCost, // This is material cost only, without material-specific labor
      unitType: unitType,
      materialSpecificLaborCost: materialSpecificLaborCost, // Separate cost for labor forecast
      concreteComponentCosts: type === 'concrete' ? {
        cement: parseFloat(material.concreteCementBags || 0) * parseFloat(material.concreteCementCostPerBag || 0),
        sand: parseFloat(material.concreteSandQty || 0) * parseFloat(material.concreteSandCostPerUnit || 0),
        gravel: parseFloat(material.concreteGravelQty || 0) * parseFloat(material.concreteGravelCostPerUnit || 0),
        water: parseFloat(material.concreteWaterQty || 0) * parseFloat(material.concreteWaterCostPerUnit || 0),
        mixer: parseFloat(material.concreteMixerRentalCost || 0),
        ancillary: parseFloat(material.concreteAncillaryCostValue || 0),
      } : null,
      calculatedArea: calculatedArea,
    };
  };

  const addMaterial = () => {
    if (!newMaterial.name || (newMaterial.type !== 'concrete' && !newMaterial.costPerUnit)) {
      alert(t.fillRequired);
      return;
    }

    if (newMaterial.type === 'area') {
      if (units === 'imperial' && (!newMaterial.lengthFt || !newMaterial.widthFt)) {
        alert(t.fillRequired); return;
      }
      if (units === 'metric' && (!newMaterial.lengthM || !newMaterial.widthM)) {
        alert(t.fillRequired); return;
      }
    } else if (newMaterial.type === 'linear') {
      if (units === 'imperial' && !newMaterial.lengthFt) {
        alert(t.fillRequired); return;
      }
      if (units === 'metric' && !newMaterial.lengthM) {
        alert(t.fillRequired); return;
      }
    } else if (newMaterial.type === 'units' && !newMaterial.quantity) {
      alert(t.fillRequired); return;
    } else if (newMaterial.type === 'beams') {
      if (units === 'imperial' && (!newMaterial.beamLengthFt || !newMaterial.totalSpanFt || !newMaterial.spacingFt)) {
        alert(t.fillRequired); return;
      }
      if (units === 'metric' && (!newMaterial.beamLengthM || !newMaterial.totalSpanM || !newMaterial.spacingM)) {
        alert(t.fillRequired); return;
      }
    } else if (newMaterial.type === 'concrete') {
      if (!newMaterial.concreteCementBags && !newMaterial.concreteSandQty && !newMaterial.concreteGravelQty && !newMaterial.concreteWaterQty && !newMaterial.concreteMixerRentalCost && !newMaterial.concreteAncillaryCostValue) {
        alert('Please enter at least one concrete component or cost.');
        return;
      }
    }

    const materialWithId = { ...newMaterial, id: Date.now() };
    setMaterials([...materials, materialWithId]);
    console.log("[LOG] Material added:", materialWithId);

    setNewMaterial({
      name: '',
      description: '',
      type: 'area',
      lengthFt: '',
      widthFt: '',
      heightFt: '',
      lengthM: '',
      widthM: '',
      heightM: '',
      quantity: '',
      costPerUnit: '',
      wastePercentage: 10,
      beamLengthFt: '',
      beamWidthFt: '',
      beamHeightFt: '',
      totalSpanFt: '',
      spacingFt: '',
      beamLengthM: '',
      beamWidthM: '',
      beamHeightM: '',
      totalSpanM: '',
      spacingM: '',
      materialLaborTrade: '',
      materialLaborRate: '',
      materialLaborHours: '',
      materialLaborNumberOfLaborers: 1,
      concreteCementBags: '',
      concreteCementCostPerBag: '',
      concreteSandQty: '',
      concreteSandUnit: 'cu yd',
      concreteSandCostPerUnit: '',
      concreteGravelQty: '',
      concreteGravelUnit: 'cu yd',
      concreteGravelCostPerUnit: '',
      concreteWaterQty: '',
      concreteWaterUnit: 'gal',
      concreteWaterCostPerUnit: '',
      concreteMixerRentalCost: '',
      concreteAncillaryCostName: '',
      concreteAncillaryCostValue: '',
      submittalLink: '',
      invoiceLink: '',
      subcontractorId: '', // Reset subcontractor assignment
    });
  };

  const removeMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
    console.log("[LOG] Material removed:", id);
  };

  const addLaborTrade = () => {
    if (!newLaborTrade.tradeName || !newLaborTrade.rate || !newLaborTrade.hours || !newLaborTrade.numberOfLaborers) {
      alert(t.fillRequired);
      return;
    }
    setLaborTrades([...laborTrades, { ...newLaborTrade, id: Date.now() }]);
    console.log("[LOG] Labor trade added:", newLaborTrade);
    setNewLaborTrade({ tradeName: '', rate: '', hours: '', numberOfLaborers: 1, subcontractorId: '' }); // Reset subcontractor assignment
  };

  const removeLaborTrade = (id) => {
    setLaborTrades(laborTrades.filter(trade => trade.id !== id));
    console.log("[LOG] Labor trade removed:", id);
  };

  // New: Calculate Equipment Cost
  const calculateEquipmentCost = (item) => {
    let equipmentCost = 0;
    if (item.type === 'purchase') {
      equipmentCost = parseFloat(item.purchaseCost || 0);
    } else if (item.type === 'rental') {
      const rate = parseFloat(item.rentalRate || 0);
      const days = parseFloat(item.numberOfDays || 0);
      const hours = parseFloat(item.numberOfHours || 0);

      switch (item.rentalUnit) {
        case 'day':
          equipmentCost = rate * days;
          break;
        case 'week':
          equipmentCost = rate * (days / 7);
          break;
        case 'month':
          equipmentCost = rate * (days / 30);
          break;
        case 'hour':
          equipmentCost = rate * hours;
          break;
        default:
          equipmentCost = 0;
      }
    }
    // Equipment-specific labor cost is calculated here but NOT added to equipmentCost
    const equipmentSpecificLaborCost = parseFloat(item.equipmentLaborRate || 0) * parseFloat(item.equipmentLaborHours || 0) * parseFloat(item.equipmentLaborNumberOfLaborers || 1);

    return {
      totalCost: equipmentCost, // This is equipment cost only
      equipmentSpecificLaborCost: equipmentSpecificLaborCost, // Separate cost for labor forecast
    };
  };

  // New: Add Equipment
  const addEquipment = () => {
    if (!newEquipment.name) {
      alert(t.fillRequired);
      return;
    }
    if (newEquipment.type === 'purchase' && !newEquipment.purchaseCost) {
      alert(t.fillRequired);
      return;
    }
    if (newEquipment.type === 'rental') {
      if (!newEquipment.rentalRate) {
        alert(t.fillRequired);
        return;
      }
      if (newEquipment.rentalUnit === 'day' && !newEquipment.numberOfDays) {
        alert(t.fillRequired);
        return;
      }
      if (newEquipment.rentalUnit === 'hour' && !newEquipment.numberOfHours) {
        alert(t.fillRequired);
        return;
      }
      if ((newEquipment.rentalUnit === 'week' || newEquipment.rentalUnit === 'month') && !newEquipment.numberOfDays) {
        alert(t.fillRequired); // For week/month, still need days to convert
        return;
      }
    }

    const equipmentWithId = { ...newEquipment, id: Date.now() };
    setEquipment([...equipment, equipmentWithId]);
    console.log("[LOG] Equipment added:", equipmentWithId);
    setNewEquipment({
      name: '',
      description: '',
      type: 'rental',
      purchaseCost: '',
      usefulLifeYears: '',
      rentalRate: '',
      rentalUnit: 'day',
      numberOfDays: '',
      numberOfHours: '',
      equipmentLaborTrade: '',
      equipmentLaborRate: '',
      equipmentLaborHours: '',
      equipmentLaborNumberOfLaborers: 1,
      submittalLink: '',
      invoiceLink: '',
      subcontractorId: '', // Reset subcontractor assignment
    });
  };

  // New: Remove Equipment
  const removeEquipment = (id) => {
    setEquipment(equipment.filter(e => e.id !== id));
    console.log("[LOG] Equipment removed:", id);
  };

  const getTotalMaterialCost = () => {
    return materials.reduce((total, material) => {
      const cost = calculateMaterialCost(material);
      return total + cost.totalCost; // This is material cost only
    }, 0);
  };

  // New function to get total material-specific labor cost
  const getTotalMaterialSpecificLaborCost = () => {
    return materials.reduce((total, material) => {
      const cost = calculateMaterialCost(material);
      return total + cost.materialSpecificLaborCost;
    }, 0);
  };

  // New function to get total equipment cost (excluding labor)
  const getTotalEquipmentCost = () => {
    return equipment.reduce((total, item) => {
      const cost = calculateEquipmentCost(item);
      return total + cost.totalCost;
    }, 0);
  };

  // New function to get total equipment-specific labor cost
  const getTotalEquipmentSpecificLaborCost = () => {
    return equipment.reduce((total, item) => {
      const cost = calculateEquipmentCost(item);
      return total + cost.equipmentSpecificLaborCost;
    }, 0);
  };

  const getTotalProjectLaborCost = () => {
    const projectLabor = laborTrades.reduce((total, trade) => {
      return total + (parseFloat(trade.rate || 0) * parseFloat(trade.hours || 0) * parseFloat(trade.numberOfLaborers || 1));
    }, 0);
    const materialSpecificLabor = getTotalMaterialSpecificLaborCost();
    const equipmentSpecificLabor = getTotalEquipmentSpecificLaborCost(); // Include equipment-specific labor
    return projectLabor + materialSpecificLabor + equipmentSpecificLabor;
  };

  const getGrandTotal = () => {
    return getTotalMaterialCost() + getTotalProjectLaborCost() + getTotalEquipmentCost();
  };

  const getCostPerUnitLabel = (type, currentUnits) => {
    if (type === 'area') {
      return currentUnits === 'imperial' ? t.costPerSqFt : t.costPerSqM;
    } else if (type === 'linear') {
      return currentUnits === 'imperial' ? t.costPerLinearFt : t.costPerLinearM;
    } else if (type === 'units') {
      return t.costPerIndividualUnit;
    } else if (type === 'beams') {
      return t.costPerBeam;
    }
    return t.costPerUnit;
  };

  // Converter Functions
  const handleFtInConvert = () => {
    const value = parseFloat(ftInValue);
    if (!isNaN(value)) {
      if (ftInUnit === 'in') {
        setFtInOutput(`${(value / 12).toFixed(2)} ${t.feet}`);
      } else {
        setFtInOutput(`${(value * 12).toFixed(2)} ${t.inches}`);
      }
    } else {
      setFtInOutput('');
    }
  };

  const handleMCmConvert = () => {
    const value = parseFloat(mCmValue);
    if (!isNaN(value)) {
      if (mCmUnit === 'cm') {
        setMCmOutput(`${(value / 100).toFixed(2)} ${t.meters}`);
      } else {
        setMCmOutput(`${(value * 100).toFixed(2)} ${t.centimeters}`);
      }
    } else {
      setMCmOutput('');
    }
  };

  // Live area calculation for display
  const getLiveCalculatedArea = () => {
    if (newMaterial.type === 'area') {
      let length, width;
      if (units === 'imperial') {
        length = toFeetDecimal(newMaterial.lengthFt);
        width = toFeetDecimal(newMaterial.widthFt);
      } else {
        length = toMetersDecimal(newMaterial.lengthM);
        width = toMetersDecimal(newMaterial.widthM);
      }
      if (length && width) {
        const area = (length * width).toFixed(2);
        return `${area} ${units === 'imperial' ? t.sqft : t.sqm}`;
      }
    }
    return '';
  };

  // Helper function for locale-specific currency formatting
  const formatCurrency = (value, currencyCode) => {
    if (isNaN(value) || value === null || value === undefined) {
      return new Intl.NumberFormat(getLocale(language), {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }
    return new Intl.NumberFormat(getLocale(language), {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Helper to get locale based on selected language
  const getLocale = (lang) => {
    switch (lang) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'it': return 'it-IT';
      case 'fr': return 'fr-FR';
      case 'de': return 'de-DE';
      case 'zh': return 'zh-Hans-CN';
      default: return 'en-US';
    }
  };

  const exportAsPDF = () => {
    const totalMaterialCost = getTotalMaterialCost();
    const totalProjectLaborCost = getTotalProjectLaborCost();
    const totalEquipmentCost = getTotalEquipmentCost();
    const grandTotal = getGrandTotal();

    const totalForecastLandCost = getTotalForecastCostByCategory('Land');
    const totalForecastMaterialCost = getTotalForecastCostByCategory('Material');
    const totalForecastLaborCost = getTotalForecastCostByCategory('Labor');
    const totalForecastEquipmentCost = getTotalForecastCostByCategory('Equipment');
    const totalForecastOtherCost = getTotalForecastCostByCategory('Other');
    const grandTotalForecast = getTotalForecastGrandTotal();


    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${t.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; border-top: 2px solid #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .sub-item { margin-left: 15px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t.title}</h1>
            <p><strong>${language === 'en' ? 'Date' : 'Fecha'}:</strong> ${new Date().toLocaleDateString(getLocale(language))}</p>
            <p><strong>${language === 'en' ? 'Units' : 'Unidades'}:</strong> ${units === 'imperial' ? t.imperial : t.metric}</p>
            <p><strong>${t.currency}:</strong> ${selectedCurrency.name} (${selectedCurrency.symbol})</p>
          </div>

          <div class="section">
            <h3>${t.materialsList}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t.materialName}</th>
                  <th>${language === 'en' ? 'Type' : 'Tipo'}</th>
                  <th>${t.baseUnits}</th>
                  <th>${t.wasteAmount}</th>
                  <th>${t.totalUnitsWithWaste}</th>
                  <th>${t.costPerUnit}</th>
                  <th>${t.totalCost}</th>
                  <th>${t.assignedSubcontractor}</th>
                </tr>
              </thead>
              <tbody>
                ${materials.map(material => {
                  const cost = calculateMaterialCost(material);
                  const subcontractorName = material.subcontractorId ? subcontractors.find(sc => sc.id === material.subcontractorId)?.name : 'N/A';
                  let detailRows = '';
                  if (material.type === 'concrete' && cost.concreteComponentCosts) {
                    detailRows += `<tr><td colspan="8"><strong>${t.concreteComponents}</strong></td></tr>`;
                    if (material.concreteCementBags) detailRows += `<tr><td class="sub-item">Cement: ${material.concreteCementBags} bags @ ${formatCurrency(parseFloat(material.concreteCementCostPerBag || 0), selectedCurrency.code)}</td><td colspan="6"></td><td>${formatCurrency(cost.concreteComponentCosts.cement, selectedCurrency.code)}</td></tr>`;
                    if (material.concreteSandQty) detailRows += `<tr><td class="sub-item">Sand: ${material.concreteSandQty} ${material.concreteSandUnit} @ ${formatCurrency(parseFloat(material.concreteSandCostPerUnit || 0), selectedCurrency.code)}</td><td colspan="6"></td><td>${formatCurrency(cost.concreteComponentCosts.sand, selectedCurrency.code)}</td></tr>`;
                    if (material.concreteGravelQty) detailRows += `<tr><td class="sub-item">Gravel: ${material.concreteGravelQty} ${material.concreteGravelUnit} @ ${formatCurrency(parseFloat(material.concreteGravelCostPerUnit || 0), selectedCurrency.code)}</td><td colspan="6"></td><td>${formatCurrency(cost.concreteComponentCosts.gravel, selectedCurrency.code)}</td></tr>`;
                    if (material.concreteWaterQty) detailRows += `<tr><td class="sub-item">Water: ${material.concreteWaterQty} ${material.concreteWaterUnit} @ ${formatCurrency(parseFloat(material.concreteWaterCostPerUnit || 0), selectedCurrency.code)}</td><td colspan="6"></td><td>${formatCurrency(cost.concreteComponentCosts.water, selectedCurrency.code)}</td></tr>`;
                    if (material.concreteMixerRentalCost) detailRows += `<tr><td class="sub-item">${t.concreteMixerRental}:</td><td colspan="6"></td><td>${formatCurrency(cost.concreteComponentCosts.mixer, selectedCurrency.code)}</td></tr>`;
                    if (material.concreteAncillaryCostName && material.concreteAncillaryCostValue) detailRows += `<tr><td class="sub-item">${material.concreteAncillaryCostName}:</td><td colspan="6"></td><td>${formatCurrency(cost.concreteComponentCosts.ancillary, selectedCurrency.code)}</td></tr>`;
                  }
                  return `
                    <tr>
                      <td>${material.name}${material.description ? `<br/><small>${material.description}</small>` : ''}
                          ${material.submittalLink ? `<br/><small><a href="${material.submittalLink}" target="_blank">${t.viewSubmittal}</a></small>` : ''}
                          ${material.invoiceLink ? `<br/><small><a href="${material.invoiceLink}" target="_blank">${t.viewInvoice}</a></small>` : ''}
                      </td>
                      <td>${t[material.type]}</td>
                      <td>${cost.baseUnits.toFixed(2)} ${cost.unitType}</td>
                      <td>${cost.wasteAmount.toFixed(2)} ${cost.unitType} (${material.wastePercentage}%)</td>
                      <td>${cost.totalUnits.toFixed(2)} ${cost.unitType}</td>
                      <td>${formatCurrency(parseFloat(material.costPerUnit || 0), selectedCurrency.code) || 'N/A'}</td>
                      <td>${formatCurrency(cost.totalCost, selectedCurrency.code)}</td>
                      <td>${subcontractorName}</td>
                    </tr>
                    ${detailRows}
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>${t.laborCostBreakdown}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t.tradeName}</th>
                  <th>${t.hourlyRate}</th>
                  <th>${t.totalHours}</th>
                  <th>${t.numberOfLaborers}</th>
                  <th>${t.totalCost}</th>
                  <th>${t.assignedSubcontractor}</th>
                </tr>
              </thead>
              <tbody>
                ${laborTrades.map(trade => `
                  <tr>
                    <td>${trade.tradeName} (Project-level)</td>
                    <td>${formatCurrency(parseFloat(trade.rate || 0), selectedCurrency.code)}</td>
                    <td>${trade.hours}</td>
                    <td>${trade.numberOfLaborers}</td>
                    <td>${formatCurrency((parseFloat(trade.rate || 0) * parseFloat(trade.hours || 0) * parseFloat(trade.numberOfLaborers || 1)), selectedCurrency.code)}</td>
                    <td>${trade.subcontractorId ? subcontractors.find(sc => sc.id === trade.subcontractorId)?.name : 'N/A'}</td>
                  </tr>
                `).join('')}
                ${materials.filter(m => calculateMaterialCost(m).materialSpecificLaborCost > 0).map(material => {
                  const cost = calculateMaterialCost(material);
                  const subcontractorName = material.subcontractorId ? subcontractors.find(sc => sc.id === material.subcontractorId)?.name : 'N/A';
                  return `
                    <tr>
                      <td>${material.materialLaborTrade} (Material: ${material.name})</td>
                      <td>${formatCurrency(parseFloat(material.materialLaborRate || 0), selectedCurrency.code)}</td>
                      <td>${material.materialLaborHours}</td>
                      <td>${material.materialLaborNumberOfLaborers}</td>
                      <td>${formatCurrency(cost.materialSpecificLaborCost, selectedCurrency.code)}</td>
                      <td>${subcontractorName}</td>
                    </tr>
                  `;
                }).join('')}
                ${equipment.filter(e => calculateEquipmentCost(e).equipmentSpecificLaborCost > 0).map(item => {
                  const cost = calculateEquipmentCost(item);
                  const subcontractorName = item.subcontractorId ? subcontractors.find(sc => sc.id === item.subcontractorId)?.name : 'N/A';
                  return `
                    <tr>
                      <td>${item.equipmentLaborTrade} (Equipment: ${item.name})</td>
                      <td>${formatCurrency(parseFloat(item.equipmentLaborRate || 0), selectedCurrency.code)}</td>
                      <td>${item.equipmentLaborHours}</td>
                      <td>${item.equipmentLaborNumberOfLaborers}</td>
                      <td>${formatCurrency(cost.equipmentSpecificLaborCost, selectedCurrency.code)}</td>
                      <td>${subcontractorName}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>${t.totalEquipmentCost}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t.equipmentName}</th>
                  <th>${t.equipmentType}</th>
                  <th>${t.totalCost}</th>
                  <th>${t.assignedSubcontractor}</th>
                </tr>
              </thead>
              <tbody>
                ${equipment.map(item => {
                  const cost = calculateEquipmentCost(item);
                  const subcontractorName = item.subcontractorId ? subcontractors.find(sc => sc.id === item.subcontractorId)?.name : 'N/A';
                  let rentalDetails = '';
                  if (item.type === 'rental') {
                    if (item.rentalUnit === 'day') rentalDetails = `${item.numberOfDays} ${t.day}${parseFloat(item.numberOfDays) !== 1 ? 's' : ''}`;
                    if (item.rentalUnit === 'week') rentalDetails = `${item.numberOfDays ? `${(parseFloat(item.numberOfDays) / 7).toFixed(1)} ${t.week}${parseFloat(item.numberOfDays) / 7 !== 1 ? 's' : ''}` : ''}`;
                    if (item.rentalUnit === 'month') rentalDetails = `${item.numberOfDays ? `${(parseFloat(item.numberOfDays) / 30).toFixed(1)} ${t.month}${parseFloat(item.numberOfDays) / 30 !== 1 ? 's' : ''}` : ''}`;
                    if (item.rentalUnit === 'hour') rentalDetails = `${item.numberOfHours} ${t.hour}${parseFloat(item.numberOfHours) !== 1 ? 's' : ''}`;
                  }
                  return `
                    <tr>
                      <td>${item.name}${item.description ? `<br/><small>${item.description}</small>` : ''}
                          ${item.submittalLink ? `<br/><small><a href="${item.submittalLink}" target="_blank">${t.viewSubmittal}</a></small>` : ''}
                          ${item.invoiceLink ? `<br/><small><a href="${item.invoiceLink}" target="_blank">${t.viewInvoice}</a></small>` : ''}
                      </td>
                      <td>${item.type === 'purchase' ? t.purchase : `${t.rental} (${rentalDetails})`}</td>
                      <td>${formatCurrency(cost.totalCost, selectedCurrency.code)}</td>
                      <td>${subcontractorName}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>${t.costForecastTitle}</h3>
            <table>
              <thead>
                <tr>
                  <th>${t.costName}</th>
                  <th>${t.costCategory}</th>
                  <th>${t.amount}</th>
                  <th>${t.assignedTasks}</th>
                </tr>
              </thead>
              <tbody>
                ${forecastCosts.map(cost => `
                  <tr>
                    <td>${cost.costName}</td>
                    <td>${t[cost.costCategory.toLowerCase()]}</td>
                    <td>${formatCurrency(parseFloat(cost.amount || 0), selectedCurrency.code)}</td>
                    <td>${cost.assignedTaskIds.map(taskId => scheduleTasks.find(task => task.id === taskId)?.taskName || '').filter(name => name).join(', ')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="summary-row">
              <span>${t.totalLandCost}</span>
              <span>${formatCurrency(totalForecastLandCost, selectedCurrency.code)}</span>
            </div>
            <div class="summary-row">
              <span>${t.totalMaterialForecastCost}</span>
              <span>${formatCurrency(totalForecastMaterialCost, selectedCurrency.code)}</span>
            </div>
            <div class="summary-row">
              <span>${t.totalLaborForecastCost}</span>
              <span>${formatCurrency(totalForecastLaborCost, selectedCurrency.code)}</span>
            </div>
            <div class="summary-row">
              <span>${t.totalEquipmentForecastCost}</span>
              <span>${formatCurrency(totalForecastEquipmentCost, selectedCurrency.code)}</span>
            </div>
            <div class="summary-row">
              <span>${t.totalOtherCost}</span>
              <span>${formatCurrency(totalForecastOtherCost, selectedCurrency.code)}</span>
            </div>
            <div class="total-row">
              <span>${t.grandTotalForecast}</span>
              <span>${formatCurrency(grandTotalForecast, selectedCurrency.code)}</span>
            </div>
          </div>

          <div class="section">
            <div class="summary-row">
              <span>${t.totalMaterialCost}:</span>
              <span>${formatCurrency(totalMaterialCost, selectedCurrency.code)}</span>
            </div>
            <div class="summary-row">
              <span>${t.totalEquipmentCost}:</span>
              <span>${formatCurrency(totalEquipmentCost, selectedCurrency.code)}</span>
            </div>
            <div class="summary-row">
              <span>${t.totalProjectLaborCost}:</span>
              <span>${formatCurrency(totalProjectLaborCost, selectedCurrency.code)}</span>
            </div>
            <div class="total-row">
              <span>${t.grandTotal}</span>
              <span>${formatCurrency(grandTotal, selectedCurrency.code)}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    console.log("[LOG] Exported cost summary as PDF.");
  };

  const exportAsExcel = () => {
    const totalMaterialCost = getTotalMaterialCost();
    const totalProjectLaborCost = getTotalProjectLaborCost();
    const totalEquipmentCost = getTotalEquipmentCost();
    const grandTotal = getGrandTotal();

    const totalForecastLandCost = getTotalForecastCostByCategory('Land');
    const totalForecastMaterialCost = getTotalForecastCostByCategory('Material');
    const totalForecastLaborCost = getTotalForecastCostByCategory('Labor');
    const totalForecastEquipmentCost = getTotalForecastCostByCategory('Equipment');
    const totalForecastOtherCost = getTotalForecastCostByCategory('Other');
    const grandTotalForecast = getTotalForecastGrandTotal();

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `${t.title}\n`;
    csvContent += `${language === 'en' ? 'Date' : 'Fecha'},${new Date().toLocaleDateString(getLocale(language))}\n`;
    csvContent += `${language === 'en' ? 'Units' : 'Unidades'},${units === 'imperial' ? t.imperial : t.metric}\n`;
    csvContent += `${t.currency},${selectedCurrency.name} (${selectedCurrency.symbol})\n\n`;

    csvContent += `"${t.materialsList}"\n`;
    csvContent += `"${t.materialName}","${t.materialDescription}","${language === 'en' ? 'Type' : 'Tipo'}","${t.baseUnits}","${t.wasteAmount}","${t.totalUnitsWithWaste}","${language === 'en' ? 'Unit Type' : 'Tipo de Unidad'}","${t.costPerUnit}","${t.totalCost}","${t.submittalLink}","${t.invoiceLink}","${t.assignedSubcontractor}"\n`;

    materials.forEach(material => {
      const cost = calculateMaterialCost(material);
      const subcontractorName = material.subcontractorId ? subcontractors.find(sc => sc.id === material.subcontractorId)?.name : 'N/A';
      csvContent += `"${material.name}","${material.description || ''}","${t[material.type]}","${cost.baseUnits.toFixed(2)}","${cost.wasteAmount.toFixed(2)}","${cost.totalUnits.toFixed(2)}","${cost.unitType}","${formatCurrency(parseFloat(material.costPerUnit || 0), selectedCurrency.code) || 'N/A'}","${formatCurrency(cost.totalCost, selectedCurrency.code)}","${material.submittalLink || ''}","${material.invoiceLink || ''}","${subcontractorName}"\n`;
      if (material.type === 'concrete' && cost.concreteComponentCosts) {
        csvContent += `"${t.concreteComponents}"\n`;
        if (material.concreteCementBags) csvContent += `,"Cement: ${material.concreteCementBags} bags @ ${formatCurrency(parseFloat(material.concreteCementCostPerBag || 0), selectedCurrency.code)}",,,,,,,,,"${formatCurrency(cost.concreteComponentCosts.cement, selectedCurrency.code)}"\n`;
        if (material.concreteSandQty) csvContent += `,"Sand: ${material.concreteSandQty} ${material.concreteSandUnit} @ ${formatCurrency(parseFloat(material.concreteSandCostPerUnit || 0), selectedCurrency.code)}",,,,,,,,,"${formatCurrency(cost.concreteComponentCosts.sand, selectedCurrency.code)}"\n`;
        if (material.concreteGravelQty) csvContent += `,"Gravel: ${material.concreteGravelQty} ${material.concreteGravelUnit} @ ${formatCurrency(parseFloat(material.concreteGravelCostPerUnit || 0), selectedCurrency.code)}",,,,,,,,,"${formatCurrency(cost.concreteComponentCosts.gravel, selectedCurrency.code)}"\n`;
        if (material.concreteWaterQty) csvContent += `,"Water: ${material.concreteWaterQty} ${material.concreteWaterUnit} @ ${formatCurrency(parseFloat(material.concreteWaterCostPerUnit || 0), selectedCurrency.code)}",,,,,,,,,"${formatCurrency(cost.concreteComponentCosts.water, selectedCurrency.code)}"\n`;
        if (material.concreteMixerRentalCost) csvContent += `,"${t.concreteMixerRental}",,,,,,,,,"${formatCurrency(cost.concreteComponentCosts.mixer, selectedCurrency.code)}"\n`;
        if (material.concreteAncillaryCostName && material.concreteAncillaryCostValue) csvContent += `,"${material.concreteAncillaryCostName}",,,,,,,,,"${formatCurrency(cost.concreteComponentCosts.ancillary, selectedCurrency.code)}"\n`;
      }
    });

    csvContent += `\n"${t.laborCostBreakdown}"\n`;
    csvContent += `"${t.tradeName}","${t.hourlyRate}","${t.totalHours}","${t.numberOfLaborers}","${t.totalCost}","${t.assignedSubcontractor}"\n`;
    laborTrades.forEach(trade => {
      const subcontractorName = trade.subcontractorId ? subcontractors.find(sc => sc.id === trade.subcontractorId)?.name : 'N/A';
      csvContent += `"${trade.tradeName} (Project-level)","${formatCurrency(parseFloat(trade.rate || 0), selectedCurrency.code)}","${trade.hours}","${trade.numberOfLaborers}","${formatCurrency((parseFloat(trade.rate || 0) * parseFloat(trade.hours || 0) * parseFloat(trade.numberOfLaborers || 1)), selectedCurrency.code)}","${subcontractorName}"\n`;
    });
    materials.filter(m => calculateMaterialCost(m).materialSpecificLaborCost > 0).forEach(material => {
      const cost = calculateMaterialCost(material);
      const subcontractorName = material.subcontractorId ? subcontractors.find(sc => sc.id === material.subcontractorId)?.name : 'N/A';
      csvContent += `"${material.materialLaborTrade} (Material: ${material.name})","${formatCurrency(parseFloat(material.materialLaborRate || 0), selectedCurrency.code)}","${material.materialLaborHours}","${material.materialLaborNumberOfLaborers}","${formatCurrency(cost.materialSpecificLaborCost, selectedCurrency.code)}","${subcontractorName}"\n`;
    });
    equipment.filter(e => calculateEquipmentCost(e).equipmentSpecificLaborCost > 0).forEach(item => {
      const cost = calculateEquipmentCost(item);
      const subcontractorName = item.subcontractorId ? subcontractors.find(sc => sc.id === item.subcontractorId)?.name : 'N/A';
      csvContent += `"${item.equipmentLaborTrade} (Equipment: ${item.name})","${formatCurrency(parseFloat(item.equipmentLaborRate || 0), selectedCurrency.code)}","${item.equipmentLaborHours}","${item.equipmentLaborNumberOfLaborers}","${formatCurrency(cost.equipmentSpecificLaborCost, selectedCurrency.code)}","${subcontractorName}"\n`;
    });

    csvContent += `\n"${t.totalEquipmentCost}"\n`;
    csvContent += `"${t.equipmentName}","${t.equipmentType}","${t.totalCost}","${t.submittalLink}","${t.invoiceLink}","${t.assignedSubcontractor}"\n`;
    equipment.forEach(item => {
      const cost = calculateEquipmentCost(item);
      const subcontractorName = item.subcontractorId ? subcontractors.find(sc => sc.id === item.subcontractorId)?.name : 'N/A';
      let rentalDetails = '';
      if (item.type === 'rental') {
        if (item.rentalUnit === 'day') rentalDetails = `${item.numberOfDays} ${t.day}${parseFloat(item.numberOfDays) !== 1 ? 's' : ''}`;
        if (item.rentalUnit === 'week') rentalDetails = `${item.numberOfDays ? `${(parseFloat(item.numberOfDays) / 7).toFixed(1)} ${t.week}${parseFloat(item.numberOfDays) / 7 !== 1 ? 's' : ''}` : ''}`;
        if (item.rentalUnit === 'month') rentalDetails = `${item.numberOfDays ? `${(parseFloat(item.numberOfDays) / 30).toFixed(1)} ${t.month}${parseFloat(item.numberOfDays) / 30 !== 1 ? 's' : ''}` : ''}`;
        if (item.rentalUnit === 'hour') rentalDetails = `${item.numberOfHours} ${t.hour}${parseFloat(item.numberOfHours) !== 1 ? 's' : ''}`;
      }
      csvContent += `"${item.name}","${item.type === 'purchase' ? t.purchase : `${t.rental} (${rentalDetails})`}","${formatCurrency(cost.totalCost, selectedCurrency.code)}","${item.submittalLink || ''}","${item.invoiceLink || ''}","${subcontractorName}"\n`;
    });


    csvContent += `\n"${t.costForecastTitle}"\n`;
    csvContent += `"${t.costName}","${t.costCategory}","${t.amount}","${t.assignedTasks}"\n`;
    forecastCosts.forEach(cost => {
      csvContent += `"${cost.costName}","${t[cost.costCategory.toLowerCase()]}","${formatCurrency(parseFloat(cost.amount || 0), selectedCurrency.code)}","${cost.assignedTaskIds.map(taskId => scheduleTasks.find(task => task.id === taskId)?.taskName || '').filter(name => name).join('; ')}"\n`;
    });
    csvContent += `"${t.totalLandCost}","${formatCurrency(totalForecastLandCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.totalMaterialForecastCost}","${formatCurrency(totalForecastMaterialCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.totalLaborForecastCost}","${formatCurrency(totalForecastLaborCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.totalEquipmentForecastCost}","${formatCurrency(totalForecastEquipmentCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.totalOtherCost}","${formatCurrency(totalForecastOtherCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.grandTotalForecast}","${formatCurrency(grandTotalForecast, selectedCurrency.code)}"\n`;


    csvContent += `\n"${t.totalMaterialCost}:","${formatCurrency(totalMaterialCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.totalEquipmentCost}:","${formatCurrency(totalEquipmentCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.totalProjectLaborCost}:","${formatCurrency(totalProjectLaborCost, selectedCurrency.code)}"\n`;
    csvContent += `"${t.grandTotal}","${formatCurrency(grandTotal, selectedCurrency.code)}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `construction_estimate_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("[LOG] Exported cost summary as Excel (CSV).");
  };

  // Scheduling functions
  const addScheduleTask = () => {
    if (!newTask.taskName || !newTask.startDate || !newTask.endDate) {
      alert(t.fillRequired);
      return;
    }
    setScheduleTasks([...scheduleTasks, { ...newTask, id: Date.now() }]);
    console.log("[LOG] Schedule task added:", newTask);
    setNewTask({ taskName: '', startDate: '', endDate: '', assignedMaterialIds: [], assignedEquipmentIds: [], subcontractorId: '' }); // Reset subcontractor assignment
  };

  const removeScheduleTask = (id) => {
    setScheduleTasks(scheduleTasks.filter(task => task.id !== id));
    console.log("[LOG] Schedule task removed:", id);
  };

  // New: Export Schedule as PDF
  const exportScheduleAsPDF = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>${t.scheduleTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            ul { margin-left: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t.scheduleTitle}</h1>
            <p><strong>${language === 'en' ? 'Date' : 'Fecha'}:</strong> ${new Date().toLocaleDateString(getLocale(language))}</p>
          </div>

          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>${t.taskName}</th>
                  <th>${t.startDate}</th>
                  <th>${t.endDate}</th>
                  <th>${t.assignedMaterials}</th>
                  <th>${t.assignedEquipment}</th>
                  <th>${t.assignedSubcontractor}</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleTasks.map(task => {
                  const assignedMaterialsNames = task.assignedMaterialIds.map(materialId => {
                    const material = materials.find(m => m.id === materialId);
                    return material ? material.name : '';
                  }).filter(name => name).join(', ');

                  const assignedEquipmentNames = task.assignedEquipmentIds.map(equipmentId => {
                    const item = equipment.find(e => e.id === equipmentId);
                    return item ? item.name : '';
                  }).filter(name => name).join(', ');

                  const subcontractorName = task.subcontractorId ? subcontractors.find(sc => sc.id === task.subcontractorId)?.name : 'N/A';

                  return `
                    <tr>
                      <td>${task.taskName}</td>
                      <td>${task.startDate}</td>
                      <td>${task.endDate}</td>
                      <td>${assignedMaterialsNames || 'N/A'}</td>
                      <td>${assignedEquipmentNames || 'N/A'}</td>
                      <td>${subcontractorName}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    console.log("[LOG] Exported schedule as PDF.");
  };

  // New: Export Schedule as Excel (CSV)
  const exportScheduleAsExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"${t.scheduleTitle}"\n`;
    csvContent += `${language === 'en' ? 'Date' : 'Fecha'},${new Date().toLocaleDateString(getLocale(language))}\n\n`;

    csvContent += `"${t.taskName}","${t.startDate}","${t.endDate}","${t.assignedMaterials}","${t.assignedEquipment}","${t.assignedSubcontractor}"\n`;

    scheduleTasks.forEach(task => {
      const assignedMaterialsNames = task.assignedMaterialIds.map(materialId => {
        const material = materials.find(m => m.id === materialId);
        return material ? material.name : '';
      }).filter(name => name).join('; ');

      const assignedEquipmentNames = task.assignedEquipmentIds.map(equipmentId => {
        const item = equipment.find(e => e.id === equipmentId);
        return item ? item.name : '';
      }).filter(name => name).join('; ');

      const subcontractorName = task.subcontractorId ? subcontractors.find(sc => sc.id === task.subcontractorId)?.name : 'N/A';

      csvContent += `"${task.taskName}","${task.startDate}","${task.endDate}","${assignedMaterialsNames}","${assignedEquipmentNames}","${subcontractorName}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `construction_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("[LOG] Exported schedule as Excel (CSV).");
  };


  // Cost Forecast functions
  const addForecastCost = () => {
    if (!newForecastCost.costName || !newForecastCost.amount || isNaN(parseFloat(newForecastCost.amount))) {
      alert(t.fillRequired);
      return;
    }
    setForecastCosts([...forecastCosts, { ...newForecastCost, id: Date.now() }]);
    console.log("[LOG] Forecast cost added:", newForecastCost);
    setNewForecastCost({ costName: '', costCategory: 'Material', amount: '', assignedTaskIds: [] });
  };

  const removeForecastCost = (id) => {
    // Prevent removal of automated costs
    if (id === 'auto-material-cost' || id === 'auto-labor-cost' || id === 'auto-equipment-cost') {
      return;
    }
    setForecastCosts(forecastCosts.filter(cost => cost.id !== id));
    console.log("[LOG] Forecast cost removed:", id);
  };

  const getTotalForecastCostByCategory = (category) => {
    return forecastCosts
      .filter(cost => cost.costCategory === category)
      .reduce((total, cost) => total + parseFloat(cost.amount || 0), 0);
  };

  const getTotalForecastGrandTotal = () => {
    return forecastCosts.reduce((total, cost) => total + parseFloat(cost.amount || 0), 0);
  };

  // Effect to automate material, labor, and equipment costs into the forecast
  useEffect(() => {
    const currentMaterialCost = getTotalMaterialCost();
    const currentProjectLaborCost = getTotalProjectLaborCost();
    const currentEquipmentCost = getTotalEquipmentCost();

    setForecastCosts(prevForecastCosts => {
      const manualForecasts = prevForecastCosts.filter(
        (cost) => cost.id !== 'auto-material-cost' && cost.id !== 'auto-labor-cost' && cost.id !== 'auto-equipment-cost'
      );

      const newAutomatedMaterial = {
        id: 'auto-material-cost',
        costName: `${t.totalMaterialCost} (${t.costCalculatorTab})`,
        costCategory: 'Material',
        amount: currentMaterialCost.toFixed(2),
        assignedTaskIds: [],
      };

      const newAutomatedLabor = {
        id: 'auto-labor-cost',
        costName: `${t.totalProjectLaborCost} (${t.costCalculatorTab})`,
        costCategory: 'Labor',
        amount: currentProjectLaborCost.toFixed(2),
        assignedTaskIds: [],
      };

      const newAutomatedEquipment = {
        id: 'auto-equipment-cost',
        costName: `${t.totalEquipmentCost} (${t.costCalculatorTab})`,
        costCategory: 'Equipment',
        amount: currentEquipmentCost.toFixed(2),
        assignedTaskIds: [],
      };

      // Combine and return new state
      return [...manualForecasts, newAutomatedMaterial, newAutomatedLabor, newAutomatedEquipment];
    });
    console.log("[LOG] Automated costs updated in forecast.");
  }, [materials, laborTrades, equipment, language, units, selectedCurrency, t]); // Dependencies: materials, laborTrades, equipment, and translation/currency settings

  // Subcontractor functions
  const addSubcontractor = () => {
    if (!newSubcontractor.name || !newSubcontractor.company || !newSubcontractor.contactInfo) {
      alert(t.fillRequired);
      return;
    }
    setSubcontractors([...subcontractors, { ...newSubcontractor, id: Date.now() }]);
    console.log("[LOG] Subcontractor added:", newSubcontractor);
    setNewSubcontractor({ name: '', company: '', contactInfo: '' });
  };

  const removeSubcontractor = (id) => {
    setSubcontractors(subcontractors.filter(sc => sc.id !== id));
    console.log("[LOG] Subcontractor removed:", id);
  };

  const calculateSubcontractorTotalCosts = (subcontractorId) => {
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalEquipmentCost = 0;

    materials.forEach(material => {
      if (material.subcontractorId === subcontractorId) {
        totalMaterialCost += calculateMaterialCost(material).totalCost;
        totalLaborCost += calculateMaterialCost(material).materialSpecificLaborCost; // Material-specific labor
      }
    });

    laborTrades.forEach(trade => {
      if (trade.subcontractorId === subcontractorId) {
        totalLaborCost += (parseFloat(trade.rate || 0) * parseFloat(trade.hours || 0) * parseFloat(trade.numberOfLaborers || 1));
      }
    });

    equipment.forEach(item => {
      if (item.subcontractorId === subcontractorId) {
        totalEquipmentCost += calculateEquipmentCost(item).totalCost;
        totalLaborCost += calculateEquipmentCost(item).equipmentSpecificLaborCost; // Equipment-specific labor
      }
    });

    return {
      material: totalMaterialCost,
      labor: totalLaborCost,
      equipment: totalEquipmentCost,
      grandTotal: totalMaterialCost + totalLaborCost + totalEquipmentCost,
    };
  };


  return (
    <div className="max-w-6xl mx-auto p-6 bg-white font-inter">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 sm:mt-0">
            {/* Units Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Ruler className="w-4 h-4 text-gray-600" />
              <button
                onClick={() => handleUnitsChange('imperial')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  units === 'imperial' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-green-600 hover:bg-gray-200'
                }`}
              >
                {t.imperial}
              </button>
              <button
                onClick={() => handleUnitsChange('metric')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  units === 'metric' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-green-600 hover:bg-gray-200'
                }`}
              >
                {t.metric}
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Globe className="w-4 h-4 text-gray-600" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'es' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                }`}
              >
                Español
              </button>
              <button
                onClick={() => setLanguage('it')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'it' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                }`}
              >
                Italiano
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'fr' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'de' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                }`}
              >
                Deutsch
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'zh' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200'
                }`}
              >
                中文
              </button>
            </div>

            {/* Currency Dropdown */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <label htmlFor="currency-select" className="sr-only">{t.currency}</label>
              <select
                id="currency-select"
                value={selectedCurrency.code}
                onChange={(e) => setSelectedCurrency(currencies.find(c => c.code === e.target.value))}
                className="p-1 text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-center sm:text-left">{t.subtitle}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex justify-center sm:justify-start mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
            activeTab === 'calculator'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.costCalculatorTab}
        </button>
        <button
          onClick={() => setActiveTab('scheduling')}
          className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
            activeTab === 'scheduling'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.schedulingTab}
        </button>
        <button
          onClick={() => setActiveTab('cost-forecast')}
          className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
            activeTab === 'cost-forecast'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.costForecastTab}
        </button>
        <button
          onClick={() => setActiveTab('subcontractors')}
          className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
            activeTab === 'subcontractors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {t.subcontractorsTab}
        </button>
      </div>

      {activeTab === 'calculator' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Material Form */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t.addMaterial}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.materialName}</label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.ph_materialName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.materialDescription}</label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder={t.ph_materialDescription}
                    rows="2"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.calculationType}</label>
                  <select
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="area">{t.area}</option>
                    <option value="linear">{t.linear}</option>
                    <option value="units">{t.units}</option>
                    <option value="beams">{t.beams}</option>
                    <option value="concrete">{t.concrete}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t.types[newMaterial.type]}</p>
                </div>

                {(newMaterial.type === 'area' || newMaterial.type === 'linear') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {units === 'imperial' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.lengthFt}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.lengthFt}
                          onChange={(e) => setNewMaterial({...newMaterial, lengthFt: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_length}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.lengthM}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.lengthM}
                          onChange={(e) => setNewMaterial({...newMaterial, lengthM: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_lengthM}
                        />
                      </div>
                    )}
                    {newMaterial.type === 'area' && (
                      units === 'imperial' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.widthFt}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newMaterial.widthFt}
                            onChange={(e) => setNewMaterial({...newMaterial, widthFt: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t.ph_width}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.widthM}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newMaterial.widthM}
                            onChange={(e) => setNewMaterial({...newMaterial, widthM: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t.ph_widthM}
                          />
                        </div>
                      )
                    )}
                    {newMaterial.type === 'area' && (
                      <div className="col-span-1 sm:col-span-2">
                        {units === 'imperial' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.heightFt} (Optional, for volume)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={newMaterial.heightFt}
                              onChange={(e) => setNewMaterial({...newMaterial, heightFt: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t.ph_height}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.heightM} (Optional, for volume)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={newMaterial.heightM}
                              onChange={(e) => setNewMaterial({...newMaterial, heightM: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t.ph_heightM}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {newMaterial.type === 'area' && (newMaterial.lengthFt || newMaterial.lengthM) && (newMaterial.widthFt || newMaterial.widthM) && (
                      <div className="col-span-1 sm:col-span-2 bg-blue-100 p-3 rounded-md text-sm font-medium text-blue-800">
                        {t.calculatedArea} {getLiveCalculatedArea()}
                      </div>
                    )}
                  </div>
                )}

                {newMaterial.type === 'units' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.quantity}</label>
                    <input
                      type="number"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial({...newMaterial, quantity: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                )}

                {newMaterial.type === 'beams' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {units === 'imperial' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.individualBeamLengthFt}</label>
                          <input type="number" step="0.01" value={newMaterial.beamLengthFt} onChange={(e) => setNewMaterial({...newMaterial, beamLengthFt: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t.ph_length} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.individualBeamWidthFt}</label>
                          <input type="number" step="0.01" value={newMaterial.beamWidthFt} onChange={(e) => setNewMaterial({...newMaterial, beamWidthFt: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t.ph_width} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.individualBeamHeightFt}</label>
                          <input type="number" step="0.01" value={newMaterial.beamHeightFt} onChange={(e) => setNewMaterial({...newMaterial, beamHeightFt: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t.ph_height} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.totalSpan} ({t.ft})</label>
                          <input type="number" step="0.01" value={newMaterial.totalSpanFt} onChange={(e) => setNewMaterial({...newMaterial, totalSpanFt: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="100" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.spacing} ({t.ft})</label>
                          <input type="number" step="0.01" value={newMaterial.spacingFt} onChange={(e) => setNewMaterial({...newMaterial, spacingFt: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="2" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.individualBeamLengthM}</label>
                          <input type="number" step="0.01" value={newMaterial.beamLengthM} onChange={(e) => setNewMaterial({...newMaterial, beamLengthM: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t.ph_lengthM} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.individualBeamWidthM}</label>
                          <input type="number" step="0.01" value={newMaterial.beamWidthM} onChange={(e) => setNewMaterial({...newMaterial, beamWidthM: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t.ph_widthM} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.individualBeamHeightM}</label>
                          <input type="number" step="0.01" value={newMaterial.beamHeightM} onChange={(e) => setNewMaterial({...newMaterial, beamHeightM: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder={t.ph_heightM} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.totalSpan} ({t.m})</label>
                          <input type="number" step="0.01" value={newMaterial.totalSpanM} onChange={(e) => setNewMaterial({...newMaterial, totalSpanM: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.spacing} ({t.m})</label>
                          <input type="number" step="0.01" value={newMaterial.spacingM} onChange={(e) => setNewMaterial({...newMaterial, spacingM: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0.6" />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {newMaterial.type === 'concrete' && (
                  <div className="space-y-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-md font-semibold mb-3 text-gray-800">{t.concreteComponents}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteCementBags}</label>
                        <input
                          type="number"
                          step="1"
                          value={newMaterial.concreteCementBags}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteCementBags: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteCementBags}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteCementCostPerBag}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.concreteCementCostPerBag}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteCementCostPerBag: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteCementCostPerBag}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteSandQty}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.concreteSandQty}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteSandQty: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteSandQty}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteSandUnit}</label>
                        <select
                          value={newMaterial.concreteSandUnit}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteSandUnit: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="cu yd">{t.cuyd}</option>
                          <option value="m³">{t.cum}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteSandCostPerUnit}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.concreteSandCostPerUnit}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteSandCostPerUnit: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteSandCostPerUnit}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteWaterQty}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.concreteWaterQty}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteWaterQty: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteWaterQty}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteWaterUnit}</label>
                        <select
                          value={newMaterial.concreteWaterUnit}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteWaterUnit: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="gal">{t.gal}</option>
                          <option value="L">{t.liter}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteWaterCostPerUnit}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.concreteWaterCostPerUnit}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteWaterCostPerUnit: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteWaterCostPerUnit}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteMixerRental}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMaterial.concreteMixerRentalCost}
                        onChange={(e) => setNewMaterial({...newMaterial, concreteMixerRentalCost: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t.ph_concreteMixerRental}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteAncillaryCostName}</label>
                        <input
                          type="text"
                          value={newMaterial.concreteAncillaryCostName}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteAncillaryCostName: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteAncillaryCostName}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.concreteAncillaryCostValue}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.concreteAncillaryCostValue}
                          onChange={(e) => setNewMaterial({...newMaterial, concreteAncillaryCostValue: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_concreteAncillaryCostValue}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newMaterial.type !== 'concrete' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getCostPerUnitLabel(newMaterial.type, units)}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMaterial.costPerUnit}
                        onChange={(e) => setNewMaterial({...newMaterial, costPerUnit: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.wastePercentage}</label>
                      <input
                        type="number"
                        value={newMaterial.wastePercentage}
                        onChange={(e) => setNewMaterial({...newMaterial, wastePercentage: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                  </div>
                )}

                {/* Submittal and Invoice Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.submittalLink}</label>
                    <input
                      type="url"
                      value={newMaterial.submittalLink}
                      onChange={(e) => setNewMaterial({...newMaterial, submittalLink: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t.ph_submittalLink}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.invoiceLink}</label>
                    <input
                      type="url"
                      value={newMaterial.invoiceLink}
                      onChange={(e) => setNewMaterial({...newMaterial, invoiceLink: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t.ph_invoiceLink}
                    />
                  </div>
                </div>

                {/* Material-Specific Labor */}
                <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-md font-semibold mb-3 text-gray-800">{t.materialSpecificLabor}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.materialLaborTrade}</label>
                      <input
                        type="text"
                        value={newMaterial.materialLaborTrade}
                        onChange={(e) => setNewMaterial({...newMaterial, materialLaborTrade: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t.ph_materialLaborTrade}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.materialLaborRate}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.materialLaborRate}
                          onChange={(e) => setNewMaterial({...newMaterial, materialLaborRate: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_materialLaborRate}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.materialLaborHours}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newMaterial.materialLaborHours}
                          onChange={(e) => setNewMaterial({...newMaterial, materialLaborHours: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_materialLaborHours}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfLaborers}</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={newMaterial.materialLaborNumberOfLaborers}
                          onChange={(e) => setNewMaterial({...newMaterial, materialLaborNumberOfLaborers: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t.ph_numberOfLaborers}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subcontractor Assignment for Material */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedSubcontractor}</label>
                  <select
                    value={newMaterial.subcontractorId}
                    onChange={(e) => setNewMaterial({...newMaterial, subcontractorId: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t.selectSubcontractorPlaceholder}</option>
                    {subcontractors.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.company})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addMaterial}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t.addToList}
                </button>
              </div>
            </div>

            {/* Add Equipment Form */}
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                {t.addEquipment}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.equipmentName}</label>
                  <input
                    type="text"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t.ph_equipmentName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.equipmentDescription}</label>
                  <textarea
                    value={newEquipment.description}
                    onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                    placeholder={t.ph_equipmentDescription}
                    rows="2"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.equipmentType}</label>
                  <select
                    value={newEquipment.type}
                    onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="rental">{t.rental}</option>
                    <option value="purchase">{t.purchase}</option>
                  </select>
                </div>

                {newEquipment.type === 'purchase' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.purchaseCost}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newEquipment.purchaseCost}
                        onChange={(e) => setNewEquipment({...newEquipment, purchaseCost: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t.ph_purchaseCost}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.usefulLifeYears}</label>
                      <input
                        type="number"
                        step="1"
                        value={newEquipment.usefulLifeYears}
                        onChange={(e) => setNewEquipment({...newEquipment, usefulLifeYears: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t.ph_usefulLifeYears}
                      />
                    </div>
                  </div>
                )}

                {newEquipment.type === 'rental' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.rentalRate}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newEquipment.rentalRate}
                          onChange={(e) => setNewEquipment({...newEquipment, rentalRate: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={t.ph_rentalRate}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.rentalUnit}</label>
                        <select
                          value={newEquipment.rentalUnit}
                          onChange={(e) => setNewEquipment({...newEquipment, rentalUnit: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="day">{t.day}</option>
                          <option value="week">{t.week}</option>
                          <option value="month">{t.month}</option>
                          <option value="hour">{t.hour}</option>
                        </select>
                      </div>
                    </div>

                    {(newEquipment.rentalUnit === 'day' || newEquipment.rentalUnit === 'week' || newEquipment.rentalUnit === 'month') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfDays}</label>
                        <input
                          type="number"
                          step="1"
                          value={newEquipment.numberOfDays}
                          onChange={(e) => setNewEquipment({...newEquipment, numberOfDays: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={t.ph_numberOfDays}
                        />
                      </div>
                    )}
                    {newEquipment.rentalUnit === 'hour' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfHours}</label>
                        <input
                          type="number"
                          step="1"
                          value={newEquipment.numberOfHours}
                          onChange={(e) => setNewEquipment({...newEquipment, numberOfHours: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={t.ph_numberOfHours}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Submittal and Invoice Links for Equipment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.submittalLink}</label>
                    <input
                      type="url"
                      value={newEquipment.submittalLink}
                      onChange={(e) => setNewEquipment({...newEquipment, submittalLink: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t.ph_submittalLink}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.invoiceLink}</label>
                    <input
                      type="url"
                      value={newEquipment.invoiceLink}
                      onChange={(e) => setNewEquipment({...newEquipment, invoiceLink: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t.ph_invoiceLink}
                    />
                  </div>
                </div>

                {/* Equipment-Specific Labor */}
                <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-md font-semibold mb-3 text-gray-800">{t.equipmentSpecificLabor}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.equipmentLaborTrade}</label>
                      <input
                        type="text"
                        value={newEquipment.equipmentLaborTrade}
                        onChange={(e) => setNewEquipment({...newEquipment, equipmentLaborTrade: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t.ph_equipmentLaborTrade}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.equipmentLaborRate}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newEquipment.equipmentLaborRate}
                          onChange={(e) => setNewEquipment({...newEquipment, equipmentLaborRate: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={t.ph_equipmentLaborRate}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.equipmentLaborHours}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newEquipment.equipmentLaborHours}
                          onChange={(e) => setNewEquipment({...newEquipment, equipmentLaborHours: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={t.ph_equipmentLaborHours}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfLaborers}</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={newEquipment.equipmentLaborNumberOfLaborers}
                          onChange={(e) => setNewEquipment({...newEquipment, equipmentLaborNumberOfLaborers: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={t.ph_numberOfLaborers}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subcontractor Assignment for Equipment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedSubcontractor}</label>
                  <select
                    value={newEquipment.subcontractorId}
                    onChange={(e) => setNewEquipment({...newEquipment, subcontractorId: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">{t.selectSubcontractorPlaceholder}</option>
                    {subcontractors.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.company})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addEquipment}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t.addEquipment}
                </button>
              </div>
            </div>

            {/* Project Labor Details */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t.laborDetails}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.tradeName}</label>
                    <input
                      type="text"
                      value={newLaborTrade.tradeName}
                      onChange={(e) => setNewLaborTrade({...newLaborTrade, tradeName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t.ph_laborTradeName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.hourlyRate}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLaborTrade.rate}
                      onChange={(e) => setNewLaborTrade({...newLaborTrade, rate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t.ph_laborHourlyRate}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.totalHours}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLaborTrade.hours}
                      onChange={(e) => setNewLaborTrade({...newLaborTrade, hours: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t.ph_laborTotalHours}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfLaborers}</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={newLaborTrade.numberOfLaborers}
                      onChange={(e) => setNewLaborTrade({...newLaborTrade, numberOfLaborers: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t.ph_numberOfLaborers}
                    />
                  </div>
                </div>

                {/* Subcontractor Assignment for Project Labor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedSubcontractor}</label>
                  <select
                    value={newLaborTrade.subcontractorId}
                    onChange={(e) => setNewLaborTrade({...newLaborTrade, subcontractorId: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t.selectSubcontractorPlaceholder}</option>
                    {subcontractors.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.company})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addLaborTrade}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t.addTrade}
                </button>
              </div>

              <h4 className="text-lg font-semibold mt-6 mb-3 text-gray-800">{t.laborCostBreakdown}</h4>
              {laborTrades.length === 0 && materials.filter(m => calculateMaterialCost(m).materialSpecificLaborCost > 0).length === 0 && equipment.filter(e => calculateEquipmentCost(e).equipmentSpecificLaborCost > 0).length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>{t.noLaborTrades}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {laborTrades.map(trade => (
                    <div key={trade.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md border border-gray-200">
                      <div className="text-sm text-gray-700">
                        <p>
                          <strong>{trade.tradeName}</strong> (Project-level): {formatCurrency(parseFloat(trade.rate || 0), selectedCurrency.code)}/{language === 'en' ? 'hr' : 'hr'} x {trade.hours} {language === 'en' ? 'hrs' : 'hrs'} x {trade.numberOfLaborers} {t.numberOfLaborers}
                          {trade.subcontractorId && <span className="ml-2 text-xs text-gray-500">({subcontractors.find(sc => sc.id === trade.subcontractorId)?.name})</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{formatCurrency((parseFloat(trade.rate || 0) * parseFloat(trade.hours || 0) * parseFloat(trade.numberOfLaborers || 1)), selectedCurrency.code)}</span>
                        <button
                          onClick={() => removeLaborTrade(trade.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {materials.filter(m => calculateMaterialCost(m).materialSpecificLaborCost > 0).map(material => {
                    const cost = calculateMaterialCost(material);
                    return (
                      <div key={`material-labor-${material.id}`} className="flex justify-between items-center bg-gray-100 p-3 rounded-md border border-gray-200">
                        <div className="text-sm text-gray-700">
                          <p>
                            <strong>{material.materialLaborTrade}</strong> (Material: {material.name}): {formatCurrency(parseFloat(material.materialLaborRate || 0), selectedCurrency.code)}/{language === 'en' ? 'hr' : 'hr'} x {parseFloat(material.materialLaborHours || 0).toFixed(2)} {language === 'en' ? 'hrs' : 'hrs'} x {parseFloat(material.materialLaborNumberOfLaborers || 1).toFixed(0)} {t.numberOfLaborers}
                            {material.subcontractorId && <span className="ml-2 text-xs text-gray-500">({subcontractors.find(sc => sc.id === material.subcontractorId)?.name})</span>}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(cost.materialSpecificLaborCost, selectedCurrency.code)}</span>
                      </div>
                    );
                  })}
                  {equipment.filter(e => calculateEquipmentCost(e).equipmentSpecificLaborCost > 0).map(item => {
                    const cost = calculateEquipmentCost(item);
                    return (
                      <div key={`equipment-labor-${item.id}`} className="flex justify-between items-center bg-gray-100 p-3 rounded-md border border-gray-200">
                        <div className="text-sm text-gray-700">
                          <p>
                            <strong>{item.equipmentLaborTrade}</strong> (Equipment: {item.name}): {formatCurrency(parseFloat(item.equipmentLaborRate || 0), selectedCurrency.code)}/{language === 'en' ? 'hr' : 'hr'} x {parseFloat(item.equipmentLaborHours || 0).toFixed(2)} {language === 'en' ? 'hrs' : 'hrs'} x {parseFloat(item.equipmentLaborNumberOfLaborers || 1).toFixed(0)} {t.numberOfLaborers}
                            {item.subcontractorId && <span className="ml-2 text-xs text-gray-500">({subcontractors.find(sc => sc.id === item.subcontractorId)?.name})</span>}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(cost.equipmentSpecificLaborCost, selectedCurrency.code)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Materials List */}
          <div className="space-y-6 lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.materialsList}</h2>

              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>{t.noMaterials}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => {
                    const cost = calculateMaterialCost(material);
                    const assignedSubcontractor = material.subcontractorId ? subcontractors.find(sc => sc.id === material.subcontractorId) : null;
                    return (
                      <div key={material.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-lg">{material.name}</h4>
                          <button
                            onClick={() => removeMaterial(material.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {material.description && <p className="text-sm text-gray-500 mb-2">{material.description}</p>}
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>{language === 'en' ? 'Type' : 'Tipo'}:</strong> {t[material.type]}</p>
                          {material.type === 'area' && cost.calculatedArea > 0 && (
                            <p><strong>{t.calculatedArea}</strong> {cost.calculatedArea.toFixed(2)} {units === 'imperial' ? t.sqft : t.sqm}</p>
                          )}
                          {material.type !== 'concrete' && (
                            <>
                              <p><strong>{t.baseUnits}</strong> {cost.baseUnits.toFixed(2)} {cost.unitType}</p>
                              <p><strong>{t.wasteAmount}</strong> {cost.wasteAmount.toFixed(2)} {cost.unitType} ({material.wastePercentage}%)</p>
                              <p><strong>{t.totalUnitsWithWaste}</strong> {cost.totalUnits.toFixed(2)} {cost.unitType}</p>
                            </>
                          )}

                          {material.type === 'concrete' && cost.concreteComponentCosts && (
                            <div className="ml-4 mt-2 space-y-1">
                              <p className="font-semibold">{t.concreteComponents}</p>
                              {material.concreteCementBags && <p className="text-xs">Cement: {material.concreteCementBags} bags @ {formatCurrency(parseFloat(material.concreteCementCostPerBag || 0), selectedCurrency.code)} = {formatCurrency(cost.concreteComponentCosts.cement, selectedCurrency.code)}</p>}
                              {material.concreteSandQty && <p className="text-xs">Sand: {material.concreteSandQty} {material.concreteSandUnit} @ {formatCurrency(parseFloat(material.concreteSandCostPerUnit || 0), selectedCurrency.code)} = {formatCurrency(cost.concreteComponentCosts.sand, selectedCurrency.code)}</p>}
                              {material.concreteGravelQty && <p className="text-xs">Gravel: {material.concreteGravelQty} {material.concreteGravelUnit} @ {formatCurrency(parseFloat(material.concreteGravelCostPerUnit || 0), selectedCurrency.code)} = {formatCurrency(cost.concreteComponentCosts.gravel, selectedCurrency.code)}</p>}
                              {material.concreteWaterQty && <p className="text-xs">Water: {material.concreteWaterQty} {material.concreteWaterUnit} @ {formatCurrency(parseFloat(material.concreteWaterCostPerUnit || 0), selectedCurrency.code)} = {formatCurrency(cost.concreteComponentCosts.water, selectedCurrency.code)}</p>}
                              {material.concreteMixerRentalCost && <p className="text-xs">{t.concreteMixerRental}: {formatCurrency(cost.concreteComponentCosts.mixer, selectedCurrency.code)}</p>}
                              {material.concreteAncillaryCostName && material.concreteAncillaryCostValue && <p className="text-xs">{material.concreteAncillaryCostName}: {formatCurrency(cost.concreteComponentCosts.ancillary, selectedCurrency.code)}</p>}
                              {material.wastePercentage > 0 && <p className="text-xs">Waste ({material.wastePercentage}%): {formatCurrency((cost.totalCost - (cost.totalCost / (1 + parseFloat(material.wastePercentage) / 100))), selectedCurrency.code)}</p>}
                            </div>
                          )}

                          {cost.materialSpecificLaborCost > 0 && (
                            <p className="text-red-600 font-semibold">
                              {/* This line is for display only, the cost itself is added to total labor */}
                              <strong>{t.materialLaborCost}</strong> (Added to total labor): {formatCurrency(cost.materialSpecificLaborCost, selectedCurrency.code)}
                            </p>
                          )}
                          <p><strong>{t.totalCost}</strong> {formatCurrency(cost.totalCost, selectedCurrency.code)}</p>
                          {assignedSubcontractor && (
                            <p className="text-blue-700">
                              <strong>{t.assignedSubcontractor}:</strong> {assignedSubcontractor.name} ({assignedSubcontractor.company})
                            </p>
                          )}
                          {material.submittalLink && (
                            <p className="flex items-center gap-1">
                              <Link className="w-4 h-4 text-blue-500" />
                              <a href={material.submittalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                {t.viewSubmittal}
                              </a>
                            </p>
                          )}
                          {material.invoiceLink && (
                            <p className="flex items-center gap-1">
                              <Link className="w-4 h-4 text-blue-500" />
                              <a href={material.invoiceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                {t.viewInvoice}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Equipment List */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.totalEquipmentCost}</h2>

              {equipment.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>{t.noEquipment}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.map((item) => {
                    const cost = calculateEquipmentCost(item);
                    const assignedSubcontractor = item.subcontractorId ? subcontractors.find(sc => sc.id === item.subcontractorId) : null;
                    let rentalDetails = '';
                    if (item.type === 'rental') {
                      if (item.rentalUnit === 'day') rentalDetails = `${item.numberOfDays} ${t.day}${parseFloat(item.numberOfDays) !== 1 ? 's' : ''}`;
                      if (item.rentalUnit === 'week') rentalDetails = `${item.numberOfDays ? `${(parseFloat(item.numberOfDays) / 7).toFixed(1)} ${t.week}${parseFloat(item.numberOfDays) / 7 !== 1 ? 's' : ''}` : ''}`;
                      if (item.rentalUnit === 'month') rentalDetails = `${item.numberOfDays ? `${(parseFloat(item.numberOfDays) / 30).toFixed(1)} ${t.month}${parseFloat(item.numberOfDays) / 30 !== 1 ? 's' : ''}` : ''}`;
                      if (item.rentalUnit === 'hour') rentalDetails = `${item.numberOfHours} ${t.hour}${parseFloat(item.numberOfHours) !== 1 ? 's' : ''}`;
                    }
                    return (
                      <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-lg">{item.name}</h4>
                          <button
                            onClick={() => removeEquipment(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {item.description && <p className="text-sm text-gray-500 mb-2">{item.description}</p>}
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>{t.equipmentType}:</strong> {item.type === 'purchase' ? t.purchase : `${t.rental} (${rentalDetails})`}</p>
                          {item.type === 'purchase' && (
                            <p><strong>{t.purchaseCost}:</strong> {formatCurrency(parseFloat(item.purchaseCost || 0), selectedCurrency.code)}</p>
                          )}
                          {item.type === 'rental' && (
                            <p><strong>{t.rentalRate}:</strong> {formatCurrency(parseFloat(item.rentalRate || 0), selectedCurrency.code)}/{t[item.rentalUnit.toLowerCase()]}</p>
                          )}
                          {item.usefulLifeYears && item.type === 'purchase' && (
                            <p><strong>{t.usefulLifeYears}:</strong> {item.usefulLifeYears}</p>
                          )}

                          {cost.equipmentSpecificLaborCost > 0 && (
                            <p className="text-red-600 font-semibold">
                              {/* This line is for display only, the cost itself is added to total labor */}
                              <strong>{t.equipmentSpecificLabor}</strong> (Added to total labor): {formatCurrency(cost.equipmentSpecificLaborCost, selectedCurrency.code)}
                            </p>
                          )}
                          <p><strong>{t.totalCost}</strong> {formatCurrency(cost.totalCost, selectedCurrency.code)}</p>
                          {assignedSubcontractor && (
                            <p className="text-blue-700">
                              <strong>{t.assignedSubcontractor}:</strong> {assignedSubcontractor.name} ({assignedSubcontractor.company})
                            </p>
                          )}
                          {item.submittalLink && (
                            <p className="flex items-center gap-1">
                              <Link className="w-4 h-4 text-blue-500" />
                              <a href={item.submittalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                {t.viewSubmittal}
                              </a>
                            </p>
                          )}
                          {item.invoiceLink && (
                            <p className="flex items-center gap-1">
                              <Link className="w-4 h-4 text-blue-500" />
                              <a href={item.invoiceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                {t.viewInvoice}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cost Summary & Export */}
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.costSummary}</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalMaterialCost}:</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalMaterialCost(), selectedCurrency.code)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalEquipmentCost}:</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalEquipmentCost(), selectedCurrency.code)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalProjectLaborCost}:</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalProjectLaborCost(), selectedCurrency.code)}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-t-2 border-green-300">
                  <span className="text-lg font-bold text-gray-900">{t.grandTotal}</span>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(getGrandTotal(), selectedCurrency.code)}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={exportAsPDF}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  {t.exportPDF}
                </button>
                <button
                  onClick={exportAsExcel}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  {t.exportExcel}
                </button>
              </div>
            </div>

            {/* Unit Converters */}
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                {t.unitConverters}
              </h2>

              <div className="space-y-4">
                {/* Feet to Inches Converter */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">{t.feetToInches}</h3>
                  <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.inputUnit}</label>
                      <div className="flex">
                        <input
                          type="number"
                          step="0.01"
                          value={ftInValue}
                          onChange={(e) => setFtInValue(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={ftInUnit === 'in' ? t.ph_ftInValue_in : t.ph_ftInValue_ft}
                        />
                        <select
                          value={ftInUnit}
                          onChange={(e) => {setFtInUnit(e.target.value); setFtInOutput('');}}
                          className="p-3 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                        >
                          <option value="in">{t.inches}</option>
                          <option value="ft">{t.feet}</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleFtInConvert}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 shadow-sm"
                    >
                      {t.convert}
                    </button>
                  </div>
                  {ftInOutput && (
                    <p className="mt-2 text-gray-700">
                      <span className="font-semibold">{t.outputUnit}: {ftInOutput}</span>
                    </p>
                  )}
                </div>

                {/* Meters to Centimeters Converter */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">{t.metersToCentimeters}</h3>
                  <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.inputUnit}</label>
                      <div className="flex">
                        <input
                          type="number"
                          step="0.01"
                          value={mCmValue}
                          onChange={(e) => setMCmValue(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={mCmUnit === 'cm' ? t.ph_mCmValue_cm : t.ph_mCmValue_m}
                        />
                        <select
                          value={mCmUnit}
                          onChange={(e) => {setMCmUnit(e.target.value); setMCmOutput('');}}
                          className="p-3 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                        >
                          <option value="cm">{t.centimeters}</option>
                          <option value="m">{t.meters}</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleMCmConvert}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 shadow-sm"
                    >
                      {t.convert}
                    </button>
                  </div>
                  {mCmOutput && (
                    <p className="mt-2 text-gray-700">
                      <span className="font-semibold">{t.outputUnit}: {mCmOutput}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scheduling' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add New Task Form */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {t.addTask}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.taskName}</label>
                  <input
                    type="text"
                    value={newTask.taskName}
                    onChange={(e) => setNewTask({...newTask, taskName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Foundation Pour, Framing, Drywall Installation"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.startDate}</label>
                    <input
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.endDate}</label>
                    <input
                      type="date"
                      value={newTask.endDate}
                      onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedMaterials}</label>
                  <MultiSelectDropdown
                    options={materials.map(m => ({ id: m.id, name: m.name, description: m.description }))}
                    selectedValues={newTask.assignedMaterialIds}
                    onChange={(selectedIds) => setNewTask({ ...newTask, assignedMaterialIds: selectedIds })}
                    placeholder={t.assignMaterialsPlaceholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.assignMaterialsPlaceholder}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedEquipment}</label>
                  <MultiSelectDropdown
                    options={equipment.map(e => ({ id: e.id, name: e.name, description: e.description }))}
                    selectedValues={newTask.assignedEquipmentIds}
                    onChange={(selectedIds) => setNewTask({ ...newTask, assignedEquipmentIds: selectedIds })}
                    placeholder={t.assignEquipmentPlaceholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.assignEquipmentPlaceholder}</p>
                </div>
                {/* Subcontractor Assignment for Task */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedSubcontractor}</label>
                  <select
                    value={newTask.subcontractorId}
                    onChange={(e) => setNewTask({...newTask, subcontractorId: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t.selectSubcontractorPlaceholder}</option>
                    {subcontractors.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.company})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t.assignSubcontractorPlaceholder}</p>
                </div>
                <button
                  onClick={addScheduleTask}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t.addScheduleTask}
                </button>
              </div>
            </div>

            {/* Export Schedule */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Download className="w-5 h-5" />
                {t.exportSchedule}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={exportScheduleAsPDF}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  {t.exportPDF}
                </button>
                <button
                  onClick={exportScheduleAsExcel}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  {t.exportExcel}
                </button>
              </div>
            </div>
          </div>

          {/* Schedule List */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.scheduleTitle}</h2>
              {scheduleTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>{t.noScheduleTasks}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduleTasks.map(task => {
                    const assignedSubcontractor = task.subcontractorId ? subcontractors.find(sc => sc.id === task.subcontractorId) : null;
                    return (
                      <div key={task.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-lg">{task.taskName}</h4>
                          <button
                            onClick={() => removeScheduleTask(task.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>{t.startDate}:</strong> {task.startDate}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>{t.endDate}:</strong> {task.endDate}
                        </p>
                        {task.assignedMaterialIds && task.assignedMaterialIds.length > 0 && (
                          <div className="mt-2 text-sm text-gray-700">
                            <strong>{t.assignedMaterials}:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {task.assignedMaterialIds.map(materialId => {
                                const material = materials.find(m => m.id === materialId);
                                return material ? <li key={material.id}>{material.name}</li> : null;
                              })}
                            </ul>
                          </div>
                        )}
                        {task.assignedEquipmentIds && task.assignedEquipmentIds.length > 0 && (
                          <div className="mt-2 text-sm text-gray-700">
                            <strong>{t.assignedEquipment}:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {task.assignedEquipmentIds.map(equipmentId => {
                                const item = equipment.find(e => e.id === equipmentId);
                                return item ? <li key={item.id}>{item.name}</li> : null;
                              })}
                            </ul>
                          </div>
                        )}
                        {assignedSubcontractor && (
                          <p className="mt-2 text-sm text-blue-700">
                            <strong>{t.assignedSubcontractor}:</strong> {assignedSubcontractor.name} ({assignedSubcontractor.company})
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cost-forecast' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add New Forecast Cost Form */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t.addForecastCost}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.costName}</label>
                  <input
                    type="text"
                    value={newForecastCost.costName}
                    onChange={(e) => setNewForecastCost({...newForecastCost, costName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.ph_costName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.costCategory}</label>
                  <select
                    value={newForecastCost.costCategory}
                    onChange={(e) => setNewForecastCost({...newForecastCost, costCategory: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Land">{t.land}</option>
                    <option value="Material">{t.material}</option>
                    <option value="Labor">{t.labor}</option>
                    <option value="Equipment">{t.equipment}</option> {/* New category option */}
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.amount} ({selectedCurrency.symbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newForecastCost.amount}
                    onChange={(e) => setNewForecastCost({...newForecastCost, amount: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.ph_amount}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.assignedTasks}</label>
                  <MultiSelectDropdown
                    options={scheduleTasks.map(t => ({ id: t.id, name: t.taskName, startDate: t.startDate, endDate: t.endDate }))}
                    selectedValues={newForecastCost.assignedTaskIds}
                    onChange={(selectedIds) => setNewForecastCost({ ...newForecastCost, assignedTaskIds: selectedIds })}
                    placeholder={t.assignTasksPlaceholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.assignTasksPlaceholder}</p>
                </div>
                <button
                  onClick={addForecastCost}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t.addForecastItem}
                </button>
              </div>
            </div>
          </div>

          {/* Forecast Costs List */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.costForecastTitle}</h2>
              {forecastCosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>{t.noForecastCosts}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {forecastCosts.map(cost => (
                    <div key={cost.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-lg">{cost.costName}</h4>
                        <button
                          onClick={() => removeForecastCost(cost.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>{t.costCategory}:</strong> {t[cost.costCategory.toLowerCase()]}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>{t.amount}:</strong> {formatCurrency(parseFloat(cost.amount || 0), selectedCurrency.code)}
                      </p>
                      {cost.assignedTaskIds && cost.assignedTaskIds.length > 0 && (
                        <div className="mt-2 text-sm text-gray-700">
                          <strong>{t.assignedTasks}:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {cost.assignedTaskIds.map(taskId => {
                              const task = scheduleTasks.find(t => t.id === taskId);
                              return task ? <li key={task.id}>{task.taskName}</li> : null;
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Forecast Summary */}
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.totalForecastCostByCategory}</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalLandCost}</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalForecastCostByCategory('Land'), selectedCurrency.code)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalMaterialForecastCost}</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalForecastCostByCategory('Material'), selectedCurrency.code)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalLaborForecastCost}</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalForecastCostByCategory('Labor'), selectedCurrency.code)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalEquipmentForecastCost}</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalForecastCostByCategory('Equipment'), selectedCurrency.code)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">{t.totalOtherCost}</span>
                  <span className="font-semibold text-lg">{formatCurrency(getTotalForecastCostByCategory('Other'), selectedCurrency.code)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-green-300">
                  <span className="text-lg font-bold text-gray-900">{t.grandTotalForecast}</span>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(getTotalForecastGrandTotal(), selectedCurrency.code)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subcontractors' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add New Subcontractor Form */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t.addSubcontractor}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.subcontractorName}</label>
                  <input
                    type="text"
                    value={newSubcontractor.name}
                    onChange={(e) => setNewSubcontractor({...newSubcontractor, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.ph_subcontractorName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.companyName}</label>
                  <input
                    type="text"
                    value={newSubcontractor.company}
                    onChange={(e) => setNewSubcontractor({...newSubcontractor, company: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.ph_companyName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.contactInfo}</label>
                  <input
                    type="text"
                    value={newSubcontractor.contactInfo}
                    onChange={(e) => setNewSubcontractor({...newSubcontractor, contactInfo: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.ph_contactInfo}
                  />
                </div>
                <button
                  onClick={addSubcontractor}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t.addContact}
                </button>
              </div>
            </div>
          </div>

          {/* Subcontractors List */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.subcontractorsList}</h2>
              {subcontractors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>{t.noSubcontractors}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subcontractors.map(subcontractor => {
                    const costs = calculateSubcontractorTotalCosts(subcontractor.id);
                    return (
                      <div key={subcontractor.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-lg">{subcontractor.name} ({subcontractor.company})</h4>
                          <button
                            onClick={() => removeSubcontractor(subcontractor.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600"><strong>{t.contactInfo}:</strong> {subcontractor.contactInfo}</p>

                        <div className="mt-4 border-t border-gray-200 pt-3 space-y-1">
                          <h5 className="font-semibold text-gray-800">{t.totalCostForSubcontractor}</h5>
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>{t.subcontractorMaterialCost}:</span>
                            <span>{formatCurrency(costs.material, selectedCurrency.code)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>{t.subcontractorLaborCost}:</span>
                            <span>{formatCurrency(costs.labor, selectedCurrency.code)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>{t.subcontractorEquipmentCost}:</span>
                            <span>{formatCurrency(costs.equipment, selectedCurrency.code)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-300">
                            <span>{t.subcontractorGrandTotal}:</span>
                            <span>{formatCurrency(costs.grandTotal, selectedCurrency.code)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstructionCalculator;
