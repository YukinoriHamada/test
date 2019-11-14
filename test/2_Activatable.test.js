const EVMRevert = require('openzeppelin-solidity/test/helpers/EVMRevert')
const expectEvent = require('openzeppelin-solidity/test/helpers/expectEvent')

const BigNumber = web3.BigNumber

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

const Activatable = artifacts.require('./Activatable.sol')

contract('Activatable', ([Owner, user1, ...accounts]) => {
    describe('as an instance', () => {

        beforeEach(async function () {
            this.activatable = await Activatable.new({ from: Owner })
        })

        it('should exist', function () {
            this.activatable.should.exist
        })

        describe('active', () => {
            it('active should return false', async function () {
                const active = await this.activatable.active()
                active.should.be.equal(false)
            })
        })

        describe('deactivate', () => {
            it('change active variable false', async function () {
                await this.activatable.activate({from:Owner})
                await this.activatable.deactivate({from:Owner})
                const active = await this.activatable.active()
                active.should.be.equal(false)
            })

            it('should not execute deactivate when not active', async function () {
                await this.activatable.deactivate({from:Owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('only owenr should execute deactive', async function () {
                await this.activatable.deactivate({from:user1})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should emit a Deactivate', async function () {
                await this.activatable.activate({from:Owner})
                const { logs } = await this.activatable.deactivate({from:Owner})
                const event = await expectEvent.inLogs(logs, 'Deactivate')

                event.args._sender.should.equal(Owner)
            })
        })

        describe('activate', () => {
            it('change active variable true', async function () {
                await this.activatable.activate({from:Owner})
                const active = await this.activatable.active()
                active.should.be.equal(true)
            })

            it('should not execute activate when  active', async function () {
                await this.activatable.activate({from:Owner})
                await this.activatable.activate({from:Owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('only owner should execute activate', async function () {
                await this.activatable.activate({from:user1})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should emit a Activate', async function () {
                const { logs } = await this.activatable.activate({from:Owner})
                const event = await expectEvent.inLogs (logs, 'Activate')

                event.args._sender.should.equal(Owner)
            })
        })


    })
})