import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as path;

import '../models/shipping_company.dart';
import '../services/api_service.dart';

class CreateShipmentScreen extends StatefulWidget {
  const CreateShipmentScreen({super.key});

  @override
  State<CreateShipmentScreen> createState() => _CreateShipmentScreenState();
}

class _CreateShipmentScreenState extends State<CreateShipmentScreen> {
  final _senderNameController = TextEditingController();
  final _senderPhoneController = TextEditingController();
  final _senderEmailController = TextEditingController();
  final _senderStreetController = TextEditingController();
  final _senderCityController = TextEditingController();
  final _senderStateController = TextEditingController();
  final _senderCountryController = TextEditingController();
  final _receiverNameController = TextEditingController();
  final _receiverPhoneController = TextEditingController();
  final _receiverEmailController = TextEditingController();
  final _receiverStreetController = TextEditingController();
  final _receiverCityController = TextEditingController();
  final _receiverStateController = TextEditingController();
  final _receiverCountryController = TextEditingController();
  final _packageDescriptionController = TextEditingController();
  final _packageValueController = TextEditingController();
  final _packageWeightController = TextEditingController();
  final _packageLengthController = TextEditingController();
  final _packageWidthController = TextEditingController();
  final _packageHeightController = TextEditingController();
  final _packageAddressController = TextEditingController();

  String _shippingType = 'local';
  String _shippingMode = 'standard';
  String _paymentMethod = 'wallet';
  String _packageType = 'documents';
  String _currency = 'SYP';
  bool _fragile = false;
  bool _packagingRequested = false;
  bool _isLoading = false;
  String? _errorMessage;
  File? _selectedImage;
  List<ShippingCompany> _companies = [];
  ShippingCompany? _selectedCompany;

  @override
  void initState() {
    super.initState();
    _loadShippingCompanies();
  }

  @override
  void dispose() {
    _senderNameController.dispose();
    _senderPhoneController.dispose();
    _senderEmailController.dispose();
    _senderStreetController.dispose();
    _senderCityController.dispose();
    _senderStateController.dispose();
    _senderCountryController.dispose();
    _receiverNameController.dispose();
    _receiverPhoneController.dispose();
    _receiverEmailController.dispose();
    _receiverStreetController.dispose();
    _receiverCityController.dispose();
    _receiverStateController.dispose();
    _receiverCountryController.dispose();
    _packageDescriptionController.dispose();
    _packageValueController.dispose();
    _packageWeightController.dispose();
    _packageLengthController.dispose();
    _packageWidthController.dispose();
    _packageHeightController.dispose();
    _packageAddressController.dispose();
    super.dispose();
  }

  Future<void> _loadShippingCompanies() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final companies = await ApiService.instance.getShippingCompanies(shippingType: _shippingType);
      setState(() {
        _companies = companies;
        _selectedCompany = companies.isNotEmpty ? companies.first : null;
      });
    } catch (error) {
      setState(() {
        _errorMessage = error is ApiException ? error.message : 'Unable to load companies';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _selectImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1200, maxHeight: 1200);
    if (picked != null) {
      setState(() {
        _selectedImage = File(picked.path);
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedCompany == null) {
      setState(() {
        _errorMessage = 'Please select a shipping company';
      });
      return;
    }

    if (_senderNameController.text.isEmpty || _receiverNameController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter sender and receiver names';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final packageValue = double.tryParse(_packageValueController.text.trim()) ?? 0;
    final packageWeight = double.tryParse(_packageWeightController.text.trim()) ?? 0;
    final packageLength = double.tryParse(_packageLengthController.text.trim()) ?? 0;
    final packageWidth = double.tryParse(_packageWidthController.text.trim()) ?? 0;
    final packageHeight = double.tryParse(_packageHeightController.text.trim()) ?? 0;

    final data = {
      'shippingType': _shippingType,
      'shippingMode': _shippingMode,
      'shippingCompany': {
        'id': _selectedCompany!.id,
      },
      'cost': {
        'paymentMethod': _paymentMethod,
      },
      'package': {
        'type': _packageType,
        'weight': packageWeight,
        'length': packageLength,
        'width': packageWidth,
        'height': packageHeight,
        'description': _packageDescriptionController.text.trim(),
        'value': packageValue,
        'currency': _currency,
        'fragile': _fragile,
        'packagingRequested': _packagingRequested,
      },
      'sender': {
        'name': _senderNameController.text.trim(),
        'phone': _senderPhoneController.text.trim(),
        'email': _senderEmailController.text.trim(),
        'street': _senderStreetController.text.trim(),
        'address': _packageAddressController.text.trim(),
        'city': _senderCityController.text.trim(),
        'state': _senderStateController.text.trim(),
        'country': _senderCountryController.text.trim(),
        'clientType': 'individual',
      },
      'receivers': [
        {
          'name': _receiverNameController.text.trim(),
          'phone': _receiverPhoneController.text.trim(),
          'email': _receiverEmailController.text.trim(),
          'street': _receiverStreetController.text.trim(),
          'address': _packageAddressController.text.trim(),
          'city': _receiverCityController.text.trim(),
          'state': _receiverStateController.text.trim(),
          'country': _receiverCountryController.text.trim(),
        }
      ],
    };

    try {
      await ApiService.instance.createShipment(
        shipmentData: data,
        packageImageFile: _selectedImage,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Shipment submitted successfully')),
      );
      _resetForm();
    } catch (error) {
      setState(() {
        _errorMessage = error is ApiException ? error.message : 'Unable to create shipment';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _resetForm() {
    _senderNameController.clear();
    _senderPhoneController.clear();
    _senderEmailController.clear();
    _senderStreetController.clear();
    _senderCityController.clear();
    _senderStateController.clear();
    _senderCountryController.clear();
    _receiverNameController.clear();
    _receiverPhoneController.clear();
    _receiverEmailController.clear();
    _receiverStreetController.clear();
    _receiverCityController.clear();
    _receiverStateController.clear();
    _receiverCountryController.clear();
    _packageDescriptionController.clear();
    _packageValueController.clear();
    _packageWeightController.clear();
    _packageLengthController.clear();
    _packageWidthController.clear();
    _packageHeightController.clear();
    _packageAddressController.clear();
    setState(() {
      _selectedImage = null;
      _fragile = false;
      _packagingRequested = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Shipment')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                    ),
                  _buildDropdown(
                    label: 'Shipping type',
                    value: _shippingType,
                    items: const [
                      DropdownMenuItem(value: 'local', child: Text('Local')),
                      DropdownMenuItem(value: 'international', child: Text('International')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _shippingType = value;
                        });
                        _loadShippingCompanies();
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildDropdown(
                    label: 'Shipping mode',
                    value: _shippingMode,
                    items: const [
                      DropdownMenuItem(value: 'standard', child: Text('Standard')),
                      DropdownMenuItem(value: 'express', child: Text('Express')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _shippingMode = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildDropdown(
                    label: 'Payment method',
                    value: _paymentMethod,
                    items: const [
                      DropdownMenuItem(value: 'wallet', child: Text('Wallet')),
                      DropdownMenuItem(value: 'cod', child: Text('Cash on delivery')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _paymentMethod = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildDropdown(
                    label: 'Shipping company',
                    value: _selectedCompany?.id,
                    items: _companies
                        .map((company) => DropdownMenuItem(value: company.id, child: Text(company.name)))
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedCompany = _companies.firstWhere((company) => company.id == value);
                      });
                    },
                  ),
                  const SizedBox(height: 14),
                  const Text('Sender details', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  _buildTextField(_senderNameController, 'Sender name'),
                  _buildTextField(_senderPhoneController, 'Sender phone', keyboardType: TextInputType.phone),
                  _buildTextField(_senderEmailController, 'Sender email', keyboardType: TextInputType.emailAddress),
                  _buildTextField(_senderStreetController, 'Sender street'),
                  _buildTextField(_senderCityController, 'Sender city'),
                  _buildTextField(_senderStateController, 'Sender state'),
                  _buildTextField(_senderCountryController, 'Sender country'),
                  const SizedBox(height: 14),
                  const Text('Receiver details', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  _buildTextField(_receiverNameController, 'Receiver name'),
                  _buildTextField(_receiverPhoneController, 'Receiver phone', keyboardType: TextInputType.phone),
                  _buildTextField(_receiverEmailController, 'Receiver email', keyboardType: TextInputType.emailAddress),
                  _buildTextField(_receiverStreetController, 'Receiver street'),
                  _buildTextField(_receiverCityController, 'Receiver city'),
                  _buildTextField(_receiverStateController, 'Receiver state'),
                  _buildTextField(_receiverCountryController, 'Receiver country'),
                  const SizedBox(height: 14),
                  const Text('Package details', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  _buildDropdown(
                    label: 'Package type',
                    value: _packageType,
                    items: const [
                      DropdownMenuItem(value: 'documents', child: Text('Documents')),
                      DropdownMenuItem(value: 'electronics', child: Text('Electronics')),
                      DropdownMenuItem(value: 'clothing', child: Text('Clothing')),
                      DropdownMenuItem(value: 'books', child: Text('Books')),
                      DropdownMenuItem(value: 'gifts', child: Text('Gifts')),
                      DropdownMenuItem(value: 'food', child: Text('Food')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _packageType = value;
                        });
                      }
                    },
                  ),
                  _buildTextField(_packageDescriptionController, 'Description'),
                  _buildTextField(_packageValueController, 'Value', keyboardType: TextInputType.number),
                  _buildDropdown(
                    label: 'Currency',
                    value: _currency,
                    items: const [
                      DropdownMenuItem(value: 'SYP', child: Text('SYP')),
                      DropdownMenuItem(value: 'USD', child: Text('USD')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _currency = value;
                        });
                      }
                    },
                  ),
                  _buildTextField(_packageWeightController, 'Weight (kg)', keyboardType: TextInputType.number),
                  _buildTextField(_packageLengthController, 'Length (cm)', keyboardType: TextInputType.number),
                  _buildTextField(_packageWidthController, 'Width (cm)', keyboardType: TextInputType.number),
                  _buildTextField(_packageHeightController, 'Height (cm)', keyboardType: TextInputType.number),
                  _buildTextField(_packageAddressController, 'Package address'),
                  Row(
                    children: [
                      Expanded(
                        child: CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Fragile'),
                          value: _fragile,
                          onChanged: (value) => setState(() {
                            _fragile = value ?? false;
                          }),
                        ),
                      ),
                      Expanded(
                        child: CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Packaging requested'),
                          value: _packagingRequested,
                          onChanged: (value) => setState(() {
                            _packagingRequested = value ?? false;
                          }),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: _selectImage,
                        icon: const Icon(Icons.image),
                        label: const Text('Attach image'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(_selectedImage != null ? path.basename(_selectedImage!.path) : 'No image selected'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading ? const CircularProgressIndicator() : const Text('Submit Shipment'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, {TextInputType keyboardType = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(border: OutlineInputBorder()),
          initialValue: value,
          items: items,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
