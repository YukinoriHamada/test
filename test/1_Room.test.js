const EVMRevert = require('openzeppelin-solidity/test/helpers/EVMRevert')
const expectEvent = require('openzeppelin-solidity/test/helpers/expectEvent')

const BigNumber = web3.BigNumber

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

const Room = artifacts.require('./Room.sol')

contract('Room',([owner, user1, ...accounts])=>{

    describe('as an instance', () => {

        beforeEach(async function() {
            this.room = await Room.new(owner,{from:owner})
        })

        it('should exist', function() {
            this.room.should.exist
        })

        describe('deposit', ()=>{
            const amount = web3.toWei('1', 'ether')

            it('should send ETH to contract', async function(){

                await this.room.deposit({from:owner, value: amount})
                const roomBalanceAfter = await web3.eth.getBalance(this.room.address)

                roomBalanceAfter.should.be.bignumber.equal(amount)
            })

            it('should not deposit with no ETH', async function(){

                await this.room.deposit({from:owner, value:0})
                    .should.be.rejectedWith(EVMRevert)

                await this.room.deposit({from:owner, value:amount})
                const roomBalanceAfter = await web3.eth.getBalance(this.room.address)
                roomBalanceAfter.should.be.bignumber.equal(amount)
            })

            it('should not deposit when not paused', async function(){
                
                await this.room.pause({from:owner})
                await this.room.deposit({from:owner, value:amount})
                    .should.be.rejectedWith(EVMRevert)

                await this.room.unpause({from:owner})
                await this.room.deposit({from:owner, value:amount})
                const roomBalanceAfter = await web3.eth.getBalance(this.room.address)

                roomBalanceAfter.should.be.bignumber.equal(amount)
            })

            it('should emit a Deposited event', async function(){
                const { logs } = await this.room.deposit({from:owner, value:amount})
                const event = await expectEvent.inLogs(logs, 'Deposited')

                event.args._depositor.should.equal(owner)
                event.args._depositedValue.should.be.bignumber.equal(amount)

            })

            
        })

        describe('sendReward', ()=>{
            const amount = web3.toWei('1', 'ether')
            const id = '1';

            beforeEach(async function () {
                await this.room.deposit({from:owner, value:amount})
            })

            it('should send reward', async function(){
                await this.room.sendReward(amount, user1, id, {from:owner})

                const roomBalanceAfter = await web3.eth.getBalance(this.room.address)


                roomBalanceAfter.should.be.bignumber.equal(0)
            })
            
            it('only owner should sendReward', async function(){
                await this.room.sendReward(amount, user1, id, {from:user1})
                    .should.be.rejectedWith(EVMRevert)


            })

            it('_reward should be greater than 0', async function(){
                await this.room.sendReward(0,user1,id,{from:owner})
                    .should.be.rejectedWith(EVMRevert)

                
            })

            it('should not send reward to same account again', async function(){
                await this.room.sendReward(amount/4,user1,id, {from:owner})

                await this.room.sendReward(amount/4,user1,id, {from:owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('room balance should be greater than _reward', async function(){
                await this.room.sendReward(amount*2, user1, id, {from:owner})
                    .should.be.rejectedWith(EVMRevert)
                
            })

            it('shoud not send reward to address(0)', async function(){
                const zeroAccount = '0x0000000000000000000000000000000000000000'

                await this.room.sendReward(amount, zeroAccount, id,{from:owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should not send reward owner', async function(){
                await this.room.sendReward(amount, owner, id, {from:owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should emit a RewardSent event', async function () {
                const { logs } = await this.room.sendReward(amount, user1, id, {from:owner})
                const event = await expectEvent.inLogs(logs, 'RewardSent')

                event.args._dest.should.equal(user1)
                event.args._reward.should.be.bignumber.equal(amount)
                event.args._id.should.be.bignumber.equal(id)
            })

        })
        describe('refundToOwner', ()=>{
            const amount = web3.toWei('1', 'ether')
            beforeEach(async function () {
                await this.room.deposit({from:owner, value:amount})
            })

            it('should refund to owner', async function () {
                await this.room.refundToOwner({from:owner})

                const roomBalanceAfter = await web3.eth.getBalance(this.room.address)
                roomBalanceAfter.should.be.bignumber.equal(0)

            })

            it('should not refund to owenr when not active', async function(){
                await this.room.activate({from:owner})
                await this.room.refundToOwner({from:owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should refund to owner by onlyowner', async function(){
                await this.room.refundToOwner({from:user1})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should not refund to owner when contract balance is zero', async function(){
                await this.room.refundToOwner({from:owner})
                const roomBalanceAfter = web3.eth.getBalance(this.room.address)
                roomBalanceAfter.should.be.bignumber.equal(0)

                await this.room.refundToOwner({from:owner})
                    .should.be.rejectedWith(EVMRevert)
            })

            it('should emit a RefundedToOwner event', async function(){
                const { logs } = await this.room.refundToOwner({from:owner})
                const event = await expectEvent.inLogs(logs, 'RefundedToOwner')

                event.args._dest.should.equal(owner)
                event.args._refundedBalance.should.be.bignumber.equal(amount)
            })

        })

    })
})