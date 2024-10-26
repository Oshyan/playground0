import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const MortgageCalculator = () => {
  // Initial loan state
  const [initialLoan, setInitialLoan] = useState({
    amount: 1300000,
    rate: 4.75,
    term: 30,
    startYear: 2024,
  });

  // Additional expenses
  const [expenses, setExpenses] = useState({
    propertyTax: 15000,
    insurance: 3000,
  });

  // Events history (rate changes and lump sum payments)
  const [events, setEvents] = useState([]);
  
  // New event form state
  const [newEvent, setNewEvent] = useState({
    type: 'rate',
    year: 2,
    rate: 4.25,
    lumpSum: 0,
  });

  // Calculate monthly payment given principal, rate, and remaining term
  const calculateMonthlyPayment = (principal, rate, term) => {
    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  // Calculate amortization schedule with events
  const calculateAmortizationSchedule = () => {
    let schedule = [];
    let currentPrincipal = initialLoan.amount;
    let currentRate = initialLoan.rate;
    let currentTerm = initialLoan.term;
    let monthlyPayment = calculateMonthlyPayment(currentPrincipal, currentRate, currentTerm);
    
    // Sort events by year
    const sortedEvents = _.sortBy(events, 'year');
    
    // Calculate monthly expenses
    const monthlyTax = expenses.propertyTax / 12;
    const monthlyInsurance = expenses.insurance / 12;
    const monthlyExtra = monthlyTax + monthlyInsurance;

    for (let year = 1; year <= initialLoan.term; year++) {
      // Apply any events for this year
      const yearEvents = sortedEvents.filter(e => e.year === year);
      yearEvents.forEach(event => {
        if (event.type === 'rate') {
          currentRate = event.rate;
          // Recalculate monthly payment with new rate and remaining term
          monthlyPayment = calculateMonthlyPayment(currentPrincipal, currentRate, initialLoan.term - year + 1);
        } else if (event.type === 'lumpSum') {
          currentPrincipal -= event.lumpSum;
          // Recalculate monthly payment with new principal
          monthlyPayment = calculateMonthlyPayment(currentPrincipal, currentRate, initialLoan.term - year + 1);
        }
      });

      schedule.push({
        year,
        principal: currentPrincipal,
        rate: currentRate,
        payment: monthlyPayment,
        totalPayment: monthlyPayment + monthlyExtra,
        propertyTax: monthlyTax,
        insurance: monthlyInsurance
      });

      // Calculate next year's starting principal
      const yearlyInterest = currentPrincipal * (currentRate / 100);
      const yearlyPrincipalPayment = (monthlyPayment * 12) - yearlyInterest;
      currentPrincipal -= yearlyPrincipalPayment;
    }

    return schedule;
  };

  const handleAddEvent = () => {
    if (newEvent.type === 'lumpSum' && newEvent.lumpSum <= 0) return;
    setEvents([...events, { ...newEvent }]);
    setNewEvent({ type: 'rate', year: 2, rate: 4.25, lumpSum: 0 });
  };

  const schedule = calculateAmortizationSchedule();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Advanced Mortgage Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Initial Loan Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan Amount ($)</label>
              <Input 
                type="number" 
                value={initialLoan.amount}
                onChange={(e) => setInitialLoan({ ...initialLoan, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Rate (%)</label>
              <Input 
                type="number" 
                step="0.01"
                value={initialLoan.rate}
                onChange={(e) => setInitialLoan({ ...initialLoan, rate: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Term (years)</label>
              <Input 
                type="number" 
                value={initialLoan.term}
                onChange={(e) => setInitialLoan({ ...initialLoan, term: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Year</label>
              <Input 
                type="number" 
                value={initialLoan.startYear}
                onChange={(e) => setInitialLoan({ ...initialLoan, startYear: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Additional Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Property Tax ($)</label>
              <Input 
                type="number" 
                value={expenses.propertyTax}
                onChange={(e) => setExpenses({ ...expenses, propertyTax: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Insurance ($)</label>
              <Input 
                type="number" 
                value={expenses.insurance}
                onChange={(e) => setExpenses({ ...expenses, insurance: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Add Event Form */}
          <div className="border p-4 rounded-lg space-y-4">
            <h3 className="font-medium">Add Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <select 
                  className="w-full p-2 border rounded"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                >
                  <option value="rate">Rate Change</option>
                  <option value="lumpSum">Lump Sum Payment</option>
                </select>
              </div>
              <div>
                <Input 
                  type="number" 
                  placeholder="Year"
                  value={newEvent.year}
                  onChange={(e) => setNewEvent({ ...newEvent, year: Number(e.target.value) })}
                />
              </div>
              {newEvent.type === 'rate' ? (
                <div>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="New Rate (%)"
                    value={newEvent.rate}
                    onChange={(e) => setNewEvent({ ...newEvent, rate: Number(e.target.value) })}
                  />
                </div>
              ) : (
                <div>
                  <Input 
                    type="number"
                    placeholder="Lump Sum Amount ($)"
                    value={newEvent.lumpSum}
                    onChange={(e) => setNewEvent({ ...newEvent, lumpSum: Number(e.target.value) })}
                  />
                </div>
              )}
              <Button onClick={handleAddEvent}>Add Event</Button>
            </div>
          </div>

          {/* Events List */}
          {events.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Scheduled Events</h3>
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div key={index} className="flex justify-between items-center border p-2 rounded">
                    <span>
                      Year {event.year}: {event.type === 'rate' ? 
                        `Rate change to ${event.rate.toFixed(2)}%` : 
                        `Lump sum payment of $${event.lumpSum.toLocaleString()}`}
                    </span>
                    <Button 
                      variant="destructive"
                      onClick={() => setEvents(events.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Cost Breakdown Chart */}
          <div className="h-96">
            <h3 className="font-medium mb-2">Monthly Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={schedule}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const year = props.payload.year;
                    const actualYear = initialLoan.startYear + year - 1;
                    const yearEvents = events.filter(e => e.year === year);
                    const payload = props.payload;
                    
                    let tooltipLines = [`${value.toFixed(2)}`];
                    tooltipLines.push(`${year}th year (${actualYear})`);
                    
                    if (yearEvents.length) {
                      tooltipLines.push('\nChanges this year:');
                      yearEvents.forEach(e => {
                        tooltipLines.push(
                          e.type === 'rate' ? 
                            `Rate changed to ${e.rate.toFixed(2)}%` : 
                            `Principal reduced by ${e.lumpSum.toLocaleString()}`
                        );
                      });
                    }
                    
                    return [tooltipLines[0], tooltipLines.slice(1).join('\n')];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="payment" 
                  name="Monthly Mortgage" 
                  stroke="#8884d8"
                  dot={(props) => {
                    const hasEvent = events.some(e => e.year === props.payload.year);
                    return hasEvent ? (
                      <circle cx={props.cx} cy={props.cy} r={6} fill="#8884d8" stroke="white" strokeWidth={2} />
                    ) : (
                      <circle cx={props.cx} cy={props.cy} r={4} fill="#8884d8" />
                    );
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={(data) => data.propertyTax + data.insurance} 
                  name="Monthly Expenses" 
                  stroke="#ff7300"
                  dot={(props) => {
                    const hasEvent = events.some(e => e.year === props.payload.year);
                    return hasEvent ? (
                      <circle cx={props.cx} cy={props.cy} r={6} fill="#ff7300" stroke="white" strokeWidth={2} />
                    ) : (
                      <circle cx={props.cx} cy={props.cy} r={4} fill="#ff7300" />
                    );
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalPayment" 
                  name="Total Monthly Cost" 
                  stroke="#82ca9d"
                  dot={(props) => {
                    const hasEvent = events.some(e => e.year === props.payload.year);
                    return hasEvent ? (
                      <circle cx={props.cx} cy={props.cy} r={6} fill="#82ca9d" stroke="white" strokeWidth={2} />
                    ) : (
                      <circle cx={props.cx} cy={props.cy} r={4} fill="#82ca9d" />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Principal Balance Chart */}
          <div className="h-96">
            <h3 className="font-medium mb-2">Principal Balance Over Time</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={schedule}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const year = props.payload.year;
                    const actualYear = initialLoan.startYear + year - 1;
                    const yearEvents = events.filter(e => e.year === year);
                    const payload = props.payload;
                    
                    let tooltipLines = [`${value.toFixed(2)}`];
                    tooltipLines.push(`${year}th year (${actualYear})`);
                    tooltipLines.push(`Monthly Payment: ${payload.payment.toFixed(2)}`);
                    tooltipLines.push(`Monthly Expenses: ${(payload.propertyTax + payload.insurance).toFixed(2)}`);
                    tooltipLines.push(`Total Monthly Cost: ${payload.totalPayment.toFixed(2)}`);
                    
                    if (yearEvents.length) {
                      tooltipLines.push('\nChanges this year:');
                      yearEvents.forEach(e => {
                        tooltipLines.push(
                          e.type === 'rate' ? 
                            `Rate changed to ${e.rate.toFixed(2)}%` : 
                            `Principal reduced by ${e.lumpSum.toLocaleString()}`
                        );
                      });
                    }
                    
                    return [tooltipLines[0], tooltipLines.slice(1).join('\n')];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="principal" 
                  name="Principal Balance" 
                  stroke="#ffc658"
                  dot={(props) => {
                    const hasEvent = events.some(e => e.year === props.payload.year);
                    return hasEvent ? (
                      <circle cx={props.cx} cy={props.cy} r={6} fill="#ffc658" stroke="white" strokeWidth={2} />
                    ) : (
                      <circle cx={props.cx} cy={props.cy} r={4} fill="#ffc658" />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Year</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Principal Balance</th>
                  <th className="p-2 text-left">Monthly Payment</th>
                  <th className="p-2 text-left">Monthly Tax</th>
                  <th className="p-2 text-left">Monthly Insurance</th>
                  <th className="p-2 text-left">Total Monthly</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((year) => {
                  const yearEvents = events.filter(e => e.year === year.year);
                  const eventNotes = yearEvents.map(e => 
                    e.type === 'rate' ? 
                      `Rate changed to ${e.rate.toFixed(2)}%` : 
                      `Principal reduced by ${(e.lumpSum / 1000).toFixed(0)}k`
                  ).join('; ');
                  
                  return (
                    <tr 
                      key={year.year} 
                      className={`border-t ${yearEvents.length ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-2">{year.year} ({initialLoan.startYear + year.year - 1})</td>
                      <td className="p-2">{year.rate.toFixed(2)}%</td>
                      <td className="p-2">${year.principal.toFixed(2)}</td>
                      <td className="p-2">${year.payment.toFixed(2)}</td>
                      <td className="p-2">${year.propertyTax.toFixed(2)}</td>
                      <td className="p-2">${year.insurance.toFixed(2)}</td>
                      <td className="p-2">${year.totalPayment.toFixed(2)}</td>
                      <td className="p-2 text-sm text-gray-600">{eventNotes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MortgageCalculator;
